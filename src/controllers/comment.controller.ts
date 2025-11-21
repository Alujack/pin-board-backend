import { ORPCError } from "@orpc/client";
import { commentModel } from "../models/comment.model.js";
import { pinModel } from "../models/pin.model.js";
import { notificationModel } from "../models/notification.model.js";
import { NotificationTypeEnum } from "../types/enums.js";
import { ObjectId } from "mongodb";
import {
    CreateCommentRequest,
    UpdateCommentRequest,
    CommentQuery,
    CommentListResponse,
    CommentResponse
} from "../types/comment.type.js";

export const commentController = {
    // Create a new comment
    async createComment(pinId: string, commentData: CreateCommentRequest, context: any): Promise<{ success: boolean; message: string; data: CommentResponse }> {
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

            // If it's a reply, check if parent comment exists
            if (commentData.parent_comment) {
                const parentComment = await commentModel.findById(commentData.parent_comment);
                if (!parentComment) {
                    throw new ORPCError("NOT_FOUND", { message: "Parent comment not found" });
                }
            }

            // Create comment
            const newComment = new commentModel({
                _id: new ObjectId(),
                pin: pinId,
                user: userId,
                content: commentData.content,
                parent_comment: commentData.parent_comment,
                likes: [],
            });

            await newComment.save();
            await newComment.populate([
                { path: "user", select: "username profile_picture" }
            ]);

            // Create notification for pin owner (if not commenting on own pin)
            const pinUserId = typeof pin.user === 'object' && '_id' in pin.user ? pin.user._id : pin.user;
            if (pinUserId.toString() !== userId.toString()) {
                await notificationModel.create({
                    _id: new ObjectId(),
                    user: pinUserId,
                    from_user: userId,
                    type: commentData.parent_comment ? NotificationTypeEnum.COMMENT_REPLIED : NotificationTypeEnum.PIN_COMMENTED,
                    content: commentData.parent_comment 
                        ? `${context.user.username} replied to your comment`
                        : `${context.user.username} commented on your pin`,
                    metadata: {
                        pin_id: pinId,
                        comment_id: newComment._id.toString(),
                        user_id: userId.toString(),
                    },
                });
            }

            // If it's a reply, notify the parent comment author
            if (commentData.parent_comment) {
                const parentComment = await commentModel.findById(commentData.parent_comment);
                if (parentComment && parentComment.user.toString() !== userId.toString()) {
                    await notificationModel.create({
                        _id: new ObjectId(),
                        user: parentComment.user,
                        from_user: userId,
                        type: NotificationTypeEnum.COMMENT_REPLIED,
                        content: `${context.user.username} replied to your comment`,
                        metadata: {
                            pin_id: pinId,
                            comment_id: newComment._id.toString(),
                            user_id: userId.toString(),
                        },
                    });
                }
            }

            return {
                success: true,
                message: "Comment created successfully",
                data: {
                    ...newComment.toObject(),
                    likesCount: 0,
                    repliesCount: 0,
                    isLiked: false,
                } as unknown as CommentResponse,
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Get comments for a pin
    async getComments(pinId: string, query: CommentQuery, context: any): Promise<CommentListResponse> {
        try {
            const userId = context.user?._id;
            const page = parseInt(query.page) || 1;
            const limit = Math.min(parseInt(query.limit) || 20, 50);

            // Build filter
            const filter: any = {
                pin: pinId,
                is_deleted: false,
            };

            // Filter by parent comment (for replies) or top-level comments
            if (query.parent_comment) {
                filter.parent_comment = query.parent_comment;
            } else {
                filter.parent_comment = { $exists: false };
            }

            // Build sort
            let sort: any = { createdAt: -1 }; // Default to newest
            switch (query.sort) {
                case "oldest":
                    sort = { createdAt: 1 };
                    break;
                case "popular":
                    // Sort by likes count (we'll need to add this as a virtual or calculate)
                    sort = { createdAt: -1 }; // For now, fallback to newest
                    break;
            }

            const skip = (page - 1) * limit;
            const total = await commentModel.countDocuments(filter);

            const comments = await commentModel
                .find(filter)
                .populate([
                    { path: "user", select: "username profile_picture" }
                ])
                .sort(sort)
                .skip(skip)
                .limit(limit);

            // Get replies count and likes count for each comment
            const commentsWithCounts = await Promise.all(
                comments.map(async (comment) => {
                    const repliesCount = await commentModel.countDocuments({
                        parent_comment: comment._id,
                        is_deleted: false,
                    });

                    const isLiked = userId ? comment.likes.some(id => id.toString() === userId.toString()) : false;

                    return {
                        ...comment.toObject(),
                        likesCount: comment.likes.length,
                        repliesCount,
                        isLiked,
                    };
                })
            );

            return {
                success: true,
                message: "Comments retrieved successfully",
                data: commentsWithCounts as unknown as CommentResponse[],
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

    // Update a comment
    async updateComment(commentId: string, updateData: UpdateCommentRequest, context: any): Promise<{ success: boolean; message: string; data: CommentResponse }> {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            const comment = await commentModel.findById(commentId);
            if (!comment) {
                throw new ORPCError("NOT_FOUND", { message: "Comment not found" });
            }

            if (comment.user.toString() !== userId.toString()) {
                throw new ORPCError("FORBIDDEN", { message: "You don't have permission to update this comment" });
            }

            comment.content = updateData.content;
            await comment.save();
            await comment.populate([
                { path: "user", select: "username profile_picture" }
            ]);

            const repliesCount = await commentModel.countDocuments({
                parent_comment: comment._id,
                is_deleted: false,
            });

            const isLiked = comment.likes.some(id => id.toString() === userId.toString());

            return {
                success: true,
                message: "Comment updated successfully",
                data: {
                    ...comment.toObject(),
                    likesCount: comment.likes.length,
                    repliesCount,
                    isLiked,
                } as unknown as CommentResponse,
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Delete a comment (soft delete)
    async deleteComment(commentId: string, context: any): Promise<{ success: boolean; message: string }> {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            const comment = await commentModel.findById(commentId);
            if (!comment) {
                throw new ORPCError("NOT_FOUND", { message: "Comment not found" });
            }

            if (comment.user.toString() !== userId.toString()) {
                throw new ORPCError("FORBIDDEN", { message: "You don't have permission to delete this comment" });
            }

            comment.is_deleted = true;
            comment.content = "[deleted]";
            await comment.save();

            return {
                success: true,
                message: "Comment deleted successfully",
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Like/Unlike a comment
    async toggleCommentLike(commentId: string, context: any): Promise<{ success: boolean; message: string; isLiked: boolean }> {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            const comment = await commentModel.findById(commentId).populate("user");
            if (!comment) {
                throw new ORPCError("NOT_FOUND", { message: "Comment not found" });
            }

            const likeIndex = comment.likes.findIndex(id => id.toString() === userId.toString());
            let isLiked = false;

            if (likeIndex > -1) {
                // Unlike
                comment.likes.splice(likeIndex, 1);
            } else {
                // Like
                comment.likes.push(new ObjectId(userId));
                isLiked = true;

                // Create notification for comment author (if not liking own comment)
                const commentUserId = typeof comment.user === 'object' && '_id' in comment.user ? comment.user._id : comment.user;
                if (commentUserId.toString() !== userId.toString()) {
                    await notificationModel.create({
                        _id: new ObjectId(),
                        user: commentUserId,
                        from_user: userId,
                        type: NotificationTypeEnum.COMMENT_LIKED,
                        content: `${context.user.username} liked your comment`,
                        metadata: {
                            comment_id: commentId,
                            user_id: userId.toString(),
                        },
                    });
                }
            }

            await comment.save();

            return {
                success: true,
                message: isLiked ? "Comment liked" : "Comment unliked",
                isLiked,
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },
};

