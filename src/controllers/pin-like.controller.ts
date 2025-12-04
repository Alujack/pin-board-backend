import { ORPCError } from "@orpc/client";
import { pinLikeModel } from "../models/pin-like.model.js";
import { pinModel } from "../models/pin.model.js";
import { notificationModel } from "../models/notification.model.js";
import { InteractionTypeEnum, NotificationTypeEnum } from "../types/enums.js";
import { ObjectId } from "mongodb";
import { interactionModel } from "../models/interaction.model.js";
import { interactionController } from "./index.js";

export const pinLikeController = {
    // Toggle like on a pin
    async togglePinLike(pinId: string, context: any): Promise<{ success: boolean; message: string; isLiked: boolean; likesCount: number }> {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            // Check if pin exists
            const pin = await pinModel.findById(pinId).populate("user");
            if (!pin) {
                throw new ORPCError("NOT_FOUND", { message: "Pin not found" });
            }

            // Check if like already exists
            const existingLike = await pinLikeModel.findOne({ pin: pinId, user: userId });

            let isLiked = false;

            if (existingLike) {
                // Unlike - delete the like
                await pinLikeModel.deleteOne({ _id: existingLike._id });
                await interactionModel.deleteOne({ user: userId, pin: pinId })
            } else {
                // Like - create new like
                await pinLikeModel.create({
                    _id: new ObjectId(),
                    pin: pinId,
                    user: userId,
                });
                isLiked = true;

                //update interaction
                if (isLiked) {
                    try {
                        const inter = await interactionModel.findOne({
                            user: userId,
                            pin: pinId,
                        })
                        if (inter) {
                            if (!inter.interactionType.includes(InteractionTypeEnum.LIKE)) {
                                inter.interactionType.push(InteractionTypeEnum.LIKE)
                                await inter.save()
                            }
                        } else {
                            await interactionController.createOne({pin: pinId, interactionType: [InteractionTypeEnum.CLICK]}, userId)
                        }
                    } catch (err: any) {
                        throw new ORPCError(err)
                    }
                }

                // Create notification for pin owner (if not liking own pin)
                const pinUserId = typeof pin.user === 'object' && '_id' in pin.user ? pin.user._id : pin.user;
                if (pinUserId.toString() !== userId.toString()) {
                    await notificationModel.create({
                        _id: new ObjectId(),
                        user: pinUserId,
                        from_user: userId,
                        type: NotificationTypeEnum.PIN_LIKED,
                        content: `${context.user.username} liked your pin`,
                        metadata: {
                            pin_id: pinId,
                            user_id: userId.toString(),
                        },
                    });
                }
            }

            // Get total likes count
            const likesCount = await pinLikeModel.countDocuments({ pin: pinId });
            return {
                success: true,
                message: isLiked ? "Pin liked" : "Pin unliked",
                isLiked,
                likesCount,
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Get likes for a pin
    async getPinLikes(pinId: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; message: string; data: any[]; pagination: any }> {
        try {
            const skip = (page - 1) * limit;
            const total = await pinLikeModel.countDocuments({ pin: pinId });

            const likes = await pinLikeModel
                .find({ pin: pinId })
                .populate([
                    { path: "user", select: "username profile_picture full_name" }
                ])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            return {
                success: true,
                message: "Likes retrieved successfully",
                data: likes,
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

    // Check if user liked a pin
    async checkPinLiked(pinId: string, context: any): Promise<{ success: boolean; isLiked: boolean; likesCount: number }> {
        try {
            const userId = context.user?._id;

            const likesCount = await pinLikeModel.countDocuments({ pin: pinId });

            if (!userId) {
                return {
                    success: true,
                    isLiked: false,
                    likesCount,
                };
            }

            const like = await pinLikeModel.findOne({ pin: pinId, user: userId });

            return {
                success: true,
                isLiked: !!like,
                likesCount,
            };
        } catch (error: any) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },
};

