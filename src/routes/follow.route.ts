import { public_permission, protected_permission } from "../config/orpc.js";
import { followController } from "../controllers/follow.controller.js";
import z from "zod";

export const followRoute = {
    // Follow a user
    followUser: protected_permission
        .route({
            path: "/follow/followUser",
            method: "POST",
            tags: ["Follow"]
        })
        .input(z.object({
            userId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            return await followController.followUser(input.userId, context);
        }),

    // Unfollow a user
    unfollowUser: protected_permission
        .route({
            path: "/follow/unfollowUser",
            method: "POST",
            tags: ["Follow"]
        })
        .input(z.object({
            userId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            return await followController.unfollowUser(input.userId, context);
        }),

    // Get followers of a user
    getFollowers: public_permission
        .route({
            path: "/follow/getFollowers",
            method: "GET",
            tags: ["Follow"]
        })
        .input(z.object({
            userId: z.string(),
            page: z.number().default(1),
            limit: z.number().default(20),
        }))
        .handler(async ({ input }: any) => {
            return await followController.getFollowers(input.userId, input.page, input.limit);
        }),

    // Get users that a user is following
    getFollowing: public_permission
        .route({
            path: "/follow/getFollowing",
            method: "GET",
            tags: ["Follow"]
        })
        .input(z.object({
            userId: z.string(),
            page: z.number().default(1),
            limit: z.number().default(20),
        }))
        .handler(async ({ input }: any) => {
            return await followController.getFollowing(input.userId, input.page, input.limit);
        }),

    // Check if user is following another user
    checkFollowing: public_permission
        .route({
            path: "/follow/checkFollowing",
            method: "GET",
            tags: ["Follow"]
        })
        .input(z.object({
            userId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            return await followController.checkFollowing(input.userId, context);
        }),

    // Get suggested users to follow
    getSuggestedUsers: protected_permission
        .route({
            path: "/follow/getSuggestedUsers",
            method: "GET",
            tags: ["Follow"]
        })
        .input(z.object({
            limit: z.number().default(10),
        }))
        .handler(async ({ input, context }: any) => {
            return await followController.getSuggestedUsers(context, input.limit);
        }),
};

