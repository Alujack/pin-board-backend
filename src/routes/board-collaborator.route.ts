import { public_permission, protected_permission, ppr } from "../config/orpc.js";
import { boardCollaboratorController } from "../controllers/board-collaborator.controller.js";
import z from "zod";

export const boardCollaboratorRoute = {
    // Add collaborator to board
    addCollaborator: ppr([])
        .route({
            path: "/boardCollaborator/addCollaborator",
            method: "POST",
            tags: ["BoardCollaborator"]
        })
        .input(z.object({
            boardId: z.string(),
            userId: z.string(),
            role: z.enum(["owner", "editor", "viewer"]).default("viewer"),
        }))
        .handler(async ({ input, context }: any) => {
            return await boardCollaboratorController.addCollaborator(input.boardId, input.userId, input.role, context);
        }),

    // Remove collaborator from board
    removeCollaborator: ppr([])
        .route({
            path: "/boardCollaborator/removeCollaborator",
            method: "POST",
            tags: ["BoardCollaborator"]
        })
        .input(z.object({
            boardId: z.string(),
            userId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            return await boardCollaboratorController.removeCollaborator(input.boardId, input.userId, context);
        }),

    // Get collaborators for a board
    getCollaborators: public_permission
        .route({
            path: "/boardCollaborator/getCollaborators",
            method: "GET",
            tags: ["BoardCollaborator"]
        })
        .input(z.object({
            boardId: z.string(),
            page: z.number().default(1),
            limit: z.number().default(20),
        }))
        .handler(async ({ input }: any) => {
            return await boardCollaboratorController.getCollaborators(input.boardId, input.page, input.limit);
        }),

    // Update collaborator role
    updateCollaboratorRole: ppr([])
        .route({
            path: "/boardCollaborator/updateCollaboratorRole",
            method: "PUT",
            tags: ["BoardCollaborator"]
        })
        .input(z.object({
            boardId: z.string(),
            userId: z.string(),
            role: z.enum(["owner", "editor", "viewer"]),
        }))
        .handler(async ({ input, context }: any) => {
            return await boardCollaboratorController.updateCollaboratorRole(input.boardId, input.userId, input.role, context);
        }),
};

