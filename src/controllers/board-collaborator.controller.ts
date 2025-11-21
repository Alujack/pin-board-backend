import { ORPCError } from "@orpc/client";
import { boardCollaboratorModel, CollaboratorRoleEnum } from "../models/board-collaborator.model.js";
import { boardModel } from "../models/board.model.js";
import { userModel } from "../models/user.model.js";
import { notificationModel } from "../models/notification.model.js";
import { NotificationTypeEnum } from "../types/enums.js";
import { ObjectId } from "mongodb";

export const boardCollaboratorController = {
    // Add collaborator to board
    async addCollaborator(boardId: string, userId: string, role: string, context: any): Promise<{ success: boolean; message: string }> {
        try {
            const currentUserId = context.user._id;
            if (!currentUserId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            // Check if board exists
            const board = await boardModel.findById(boardId);
            if (!board) {
                throw new ORPCError("NOT_FOUND", { message: "Board not found" });
            }

            // Check if current user is the board owner or has editor role
            const currentUserRole = await boardCollaboratorModel.findOne({
                board: boardId,
                user: currentUserId,
            });

            const isOwner = board.user.toString() === currentUserId.toString();
            const canAddCollaborators = isOwner || currentUserRole?.role === CollaboratorRoleEnum.OWNER;

            if (!canAddCollaborators) {
                throw new ORPCError("FORBIDDEN", { message: "You don't have permission to add collaborators" });
            }

            // Check if user exists
            const userToAdd = await userModel.findById(userId);
            if (!userToAdd) {
                throw new ORPCError("NOT_FOUND", { message: "User not found" });
            }

            // Check if already a collaborator
            const existingCollaborator = await boardCollaboratorModel.findOne({
                board: boardId,
                user: userId,
            });

            if (existingCollaborator) {
                throw new ORPCError("BAD_REQUEST", { message: "User is already a collaborator" });
            }

            // Add collaborator
            await boardCollaboratorModel.create({
                _id: new ObjectId(),
                board: boardId,
                user: userId,
                role: role as CollaboratorRoleEnum,
            });

            // Create notification
            await notificationModel.create({
                _id: new ObjectId(),
                user: userId,
                from_user: currentUserId,
                type: NotificationTypeEnum.BOARD_INVITE,
                content: `${context.user.username} invited you to collaborate on a board`,
                metadata: {
                    board_id: boardId,
                    user_id: currentUserId.toString(),
                },
            });

            return {
                success: true,
                message: "Collaborator added successfully",
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Remove collaborator from board
    async removeCollaborator(boardId: string, userId: string, context: any): Promise<{ success: boolean; message: string }> {
        try {
            const currentUserId = context.user._id;
            if (!currentUserId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            // Check if board exists
            const board = await boardModel.findById(boardId);
            if (!board) {
                throw new ORPCError("NOT_FOUND", { message: "Board not found" });
            }

            // Check if current user is the board owner
            const isOwner = board.user.toString() === currentUserId.toString();
            if (!isOwner && currentUserId.toString() !== userId) {
                throw new ORPCError("FORBIDDEN", { message: "You don't have permission to remove collaborators" });
            }

            // Remove collaborator
            const result = await boardCollaboratorModel.deleteOne({
                board: boardId,
                user: userId,
            });

            if (result.deletedCount === 0) {
                throw new ORPCError("NOT_FOUND", { message: "Collaborator not found" });
            }

            return {
                success: true,
                message: "Collaborator removed successfully",
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Get collaborators for a board
    async getCollaborators(boardId: string, page: number = 1, limit: number = 20): Promise<any> {
        try {
            const skip = (page - 1) * limit;
            const total = await boardCollaboratorModel.countDocuments({ board: boardId });

            const collaborators = await boardCollaboratorModel
                .find({ board: boardId })
                .populate([
                    { path: "user", select: "username profile_picture full_name bio" }
                ])
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            return {
                success: true,
                message: "Collaborators retrieved successfully",
                data: collaborators,
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

    // Update collaborator role
    async updateCollaboratorRole(boardId: string, userId: string, role: string, context: any): Promise<{ success: boolean; message: string }> {
        try {
            const currentUserId = context.user._id;
            if (!currentUserId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            // Check if board exists
            const board = await boardModel.findById(boardId);
            if (!board) {
                throw new ORPCError("NOT_FOUND", { message: "Board not found" });
            }

            // Check if current user is the board owner
            const isOwner = board.user.toString() === currentUserId.toString();
            if (!isOwner) {
                throw new ORPCError("FORBIDDEN", { message: "Only the board owner can update roles" });
            }

            // Update role
            const collaborator = await boardCollaboratorModel.findOneAndUpdate(
                { board: boardId, user: userId },
                { role: role as CollaboratorRoleEnum },
                { new: true }
            );

            if (!collaborator) {
                throw new ORPCError("NOT_FOUND", { message: "Collaborator not found" });
            }

            return {
                success: true,
                message: "Collaborator role updated successfully",
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },
};

