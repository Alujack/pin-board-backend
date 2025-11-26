import { public_permission, protected_permission, ppr } from "../config/orpc.js";
import { feedController } from "../controllers/feed.controller.js";
import z from "zod";

export const feedRoute = {
    // Get personalized feed
    getPersonalizedFeed: ppr([])
        .route({
            path: "/feed/getPersonalizedFeed",
            method: "GET",
            tags: ["Feed"]
        })
        .input(z.object({
            page: z.number().default(1),
            limit: z.number().default(20),
        }))
        .handler(async ({ input, context }: any) => {
            return await feedController.getPersonalizedFeed(context, input.page, input.limit);
        }),

    // Get popular pins
    getPopularPins: public_permission
        .route({
            path: "/feed/getPopularPins",
            method: "GET",
            tags: ["Feed"]
        })
        .input(z.object({
            page: z.number().default(1),
            limit: z.number().default(20),
        }))
        .handler(async ({ input, context }: any) => {
            return await feedController.getPopularPins(input.page, input.limit, context.user?._id);
        }),

    // Get related pins
    getRelatedPins: public_permission
        .route({
            path: "/feed/getRelatedPins",
            method: "GET",
            tags: ["Feed"]
        })
        .input(z.object({
            pinId: z.string(),
            limit: z.number().default(10),
        }))
        .handler(async ({ input, context }: any) => {
            return await feedController.getRelatedPins(input.pinId, input.limit, context.user?._id);
        }),
};

