import { public_permission, protected_permission } from "../config/orpc.js";
import { commentController } from "../controllers/comment.controller.js";
import {
    createCommentRequestSchema,
    updateCommentRequestSchema,
    commentQuerySchema,
} from "../types/comment.type.js";
import z from "zod";

export const commentRoute = {
    // Create a comment on a pin
    createComment: protected_permission
        .route({
            path: "/comment/createComment",
            method: "POST",
            tags: ["Comment"]
        })
        .input(z.object({
            pinId: z.string(),
            body: createCommentRequestSchema,
        }))
        .handler(async ({ input, context }: any) => {
            return await commentController.createComment(input.pinId, input.body, context);
        }),

    // Get comments for a pin
    getComments: public_permission
        .route({
            path: "/comment/getComments",
            method: "GET",
            tags: ["Comment"]
        })
        .input(commentQuerySchema.extend({
            pinId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            const { pinId, ...query } = input;
            return await commentController.getComments(pinId, query as any, context);
        }),

    // Update a comment
    updateComment: protected_permission
        .route({
            path: "/comment/updateComment",
            method: "PUT",
            tags: ["Comment"]
        })
        .input(updateCommentRequestSchema.extend({
            commentId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            const { commentId, ...body } = input;
            return await commentController.updateComment(commentId, body as any, context);
        }),

    // Delete a comment
    deleteComment: protected_permission
        .route({
            path: "/comment/deleteComment",
            method: "DELETE",
            tags: ["Comment"]
        })
        .input(z.object({
            commentId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            return await commentController.deleteComment(input.commentId, context);
        }),

    // Toggle like on a comment
    toggleCommentLike: protected_permission
        .route({
            path: "/comment/toggleCommentLike",
            method: "POST",
            tags: ["Comment"]
        })
        .input(z.object({
            commentId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            return await commentController.toggleCommentLike(input.commentId, context);
        }),
};

