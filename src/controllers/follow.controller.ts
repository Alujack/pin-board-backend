import { ORPCError } from "@orpc/client";
import { followModel } from "../models/follow.model.js";
import { userModel } from "../models/user.model.js";
import { notificationModel } from "../models/notification.model.js";
import { NotificationTypeEnum } from "../types/enums.js";
import { ObjectId } from "mongodb";

export const followController = {
    // Follow a user
    async followUser(followingId: string, context: any): Promise<{ success: boolean; message: string; isFollowing: boolean }> {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            // Can't follow yourself
            if (userId.toString() === followingId) {
                throw new ORPCError("BAD_REQUEST", { message: "You cannot follow yourself" });
            }

            // Check if user to follow exists
            const userToFollow = await userModel.findById(followingId);
            if (!userToFollow) {
                throw new ORPCError("NOT_FOUND", { message: "User not found" });
            }

            // Check if already following
            const existingFollow = await followModel.findOne({
                follower: userId,
                following: followingId,
            });

            if (existingFollow) {
                throw new ORPCError("BAD_REQUEST", { message: "Already following this user" });
            }

            // Create follow relationship
            await followModel.create({
                _id: new ObjectId(),
                follower: userId,
                following: followingId,
            });

            // Create notification
            await notificationModel.create({
                _id: new ObjectId(),
                user: followingId,
                from_user: userId,
                type: NotificationTypeEnum.NEW_FOLLOWER,
                content: `${context.user.username} started following you`,
                metadata: {
                    user_id: userId.toString(),
                },
            });

            return {
                success: true,
                message: "Successfully followed user",
                isFollowing: true,
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Unfollow a user
    async unfollowUser(followingId: string, context: any): Promise<{ success: boolean; message: string; isFollowing: boolean }> {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            // Delete follow relationship
            const result = await followModel.deleteOne({
                follower: userId,
                following: followingId,
            });

            if (result.deletedCount === 0) {
                throw new ORPCError("NOT_FOUND", { message: "Follow relationship not found" });
            }

            return {
                success: true,
                message: "Successfully unfollowed user",
                isFollowing: false,
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Get followers of a user
    async getFollowers(userId: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; message: string; data: any[]; pagination: any }> {
        try {
            const skip = (page - 1) * limit;
            const total = await followModel.countDocuments({ following: userId });

            const followers = await followModel
                .find({ following: userId })
                .populate([
                    { path: "follower", select: "username profile_picture full_name bio" }
                ])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            return {
                success: true,
                message: "Followers retrieved successfully",
                data: followers.map(f => f.follower),
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

    // Get users that a user is following
    async getFollowing(userId: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; message: string; data: any[]; pagination: any }> {
        try {
            const skip = (page - 1) * limit;
            const total = await followModel.countDocuments({ follower: userId });

            const following = await followModel
                .find({ follower: userId })
                .populate([
                    { path: "following", select: "username profile_picture full_name bio" }
                ])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            return {
                success: true,
                message: "Following retrieved successfully",
                data: following.map(f => f.following),
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

    // Check if user is following another user
    async checkFollowing(followingId: string, context: any): Promise<{ success: boolean; isFollowing: boolean; followersCount: number; followingCount: number }> {
        try {
            const userId = context.user?._id;

            const followersCount = await followModel.countDocuments({ following: followingId });
            const followingCount = await followModel.countDocuments({ follower: followingId });

            if (!userId) {
                return {
                    success: true,
                    isFollowing: false,
                    followersCount,
                    followingCount,
                };
            }

            const follow = await followModel.findOne({
                follower: userId,
                following: followingId,
            });

            return {
                success: true,
                isFollowing: !!follow,
                followersCount,
                followingCount,
            };
        } catch (error: any) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Get suggested users to follow (users not currently following)
    async getSuggestedUsers(context: any, limit: number = 10): Promise<{ success: boolean; message: string; data: any[] }> {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            // Get users the current user is already following
            const following = await followModel.find({ follower: userId }).select("following");
            const followingIds = following.map(f => f.following.toString());

            // Find users not in the following list and not the current user
            const suggestedUsers = await userModel
                .find({
                    _id: { $nin: [...followingIds, userId] },
                    is_active: "active",
                })
                .select("username profile_picture full_name bio")
                .limit(limit);

            return {
                success: true,
                message: "Suggested users retrieved successfully",
                data: suggestedUsers,
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },
};

