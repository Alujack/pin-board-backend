import { ORPCError } from "@orpc/client";
import { pinModel } from "../models/pin.model.js";
import { followModel } from "../models/follow.model.js";
import { pinLikeModel } from "../models/pin-like.model.js";
import { interactionModel } from "../models/interaction.model.js";
import { mediaService } from "../services/media/media.service.js";

export const feedController = {
    // Get personalized feed based on following
    async getPersonalizedFeed(context: any, page: number = 1, limit: number = 20): Promise<any> {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            // Get users the current user is following
            const following = await followModel.find({ follower: userId }).select("following");
            const followingIds = following.map(f => f.following);

            if (followingIds.length === 0) {
                // If not following anyone, return popular pins
                return await this.getPopularPins(page, limit, userId);
            }

            const skip = (page - 1) * limit;

            // Get pins from followed users
            const pins = await pinModel
                .find({ user: { $in: followingIds } })
                .populate([
                    { path: "user", select: "username profile_picture full_name" },
                    { path: "board", select: "name" }
                ])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            // Get media and interaction data for each pin
            const pinsWithData = await Promise.all(
                pins.map(async (pin) => {
                    const media = await mediaService.getMediaByPinId(pin._id.toString());
                    const likesCount = await pinLikeModel.countDocuments({ pin: pin._id });
                    const isLiked = await pinLikeModel.findOne({ pin: pin._id, user: userId });
                    const isSaved = context.user.saved_pins?.includes(pin._id.toString());

                    return {
                        ...pin.toObject(),
                        media,
                        likesCount,
                        isLiked: !!isLiked,
                        isSaved,
                    };
                })
            );

            const total = await pinModel.countDocuments({ user: { $in: followingIds } });

            return {
                success: true,
                message: "Feed retrieved successfully",
                data: pinsWithData,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Get popular/trending pins
    async getPopularPins(page: number = 1, limit: number = 20, userId?: string): Promise<any> {
        try {
            const skip = (page - 1) * limit;

            // Get all pins sorted by creation date (you can enhance this with actual popularity metrics)
            const pins = await pinModel
                .find()
                .populate([
                    { path: "user", select: "username profile_picture full_name" },
                    { path: "board", select: "name" }
                ])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            // Get media and interaction data for each pin
            const pinsWithData = await Promise.all(
                pins.map(async (pin) => {
                    const media = await mediaService.getMediaByPinId(pin._id.toString());
                    const likesCount = await pinLikeModel.countDocuments({ pin: pin._id });
                    
                    let isLiked = false;
                    let isSaved = false;
                    
                    if (userId) {
                        const like = await pinLikeModel.findOne({ pin: pin._id, user: userId });
                        isLiked = !!like;
                        // Check if saved (you'd need to get the user object)
                    }

                    return {
                        ...pin.toObject(),
                        media,
                        likesCount,
                        isLiked,
                        isSaved,
                    };
                })
            );

            const total = await pinModel.countDocuments();

            return {
                success: true,
                message: "Popular pins retrieved successfully",
                data: pinsWithData,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error: any) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Get related pins based on a pin (simple recommendation)
    async getRelatedPins(pinId: string, limit: number = 10, userId?: string): Promise<any> {
        try {
            const pin = await pinModel.findById(pinId);
            if (!pin) {
                throw new ORPCError("NOT_FOUND", { message: "Pin not found" });
            }

            // Simple recommendation: pins from the same board or same user
            const relatedPins = await pinModel
                .find({
                    _id: { $ne: pinId },
                    $or: [
                        { board: pin.board },
                        { user: pin.user }
                    ]
                })
                .populate([
                    { path: "user", select: "username profile_picture full_name" },
                    { path: "board", select: "name" }
                ])
                .limit(limit);

            // Get media and interaction data for each pin
            const pinsWithData = await Promise.all(
                relatedPins.map(async (relatedPin) => {
                    const media = await mediaService.getMediaByPinId(relatedPin._id.toString());
                    const likesCount = await pinLikeModel.countDocuments({ pin: relatedPin._id });
                    
                    let isLiked = false;
                    let isSaved = false;
                    
                    if (userId) {
                        const like = await pinLikeModel.findOne({ pin: relatedPin._id, user: userId });
                        isLiked = !!like;
                    }

                    return {
                        ...relatedPin.toObject(),
                        media,
                        likesCount,
                        isLiked,
                        isSaved,
                    };
                })
            );

            return {
                success: true,
                message: "Related pins retrieved successfully",
                data: pinsWithData,
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },
};

