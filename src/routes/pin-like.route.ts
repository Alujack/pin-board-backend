import { public_permission, ppr } from "../config/orpc.js";
import { pinLikeController } from "../controllers/pin-like.controller.js";
import z from "zod";

export const pinLikeRoute = {
    // Toggle like on a pin
    togglePinLike: ppr([])
        .route({
            path: "/pinLike/togglePinLike",
            method: "POST",
            tags: ["PinLike"]
        })
        .input(z.object({
            pinId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            return await pinLikeController.togglePinLike(input.pinId, context);
        }),

    // Get likes for a pin
    getPinLikes: public_permission
        .route({
            path: "/pinLike/getPinLikes",
            method: "GET",
            tags: ["PinLike"]
        })
        .input(z.object({
            pinId: z.string(),
            page: z.number().default(1),
            limit: z.number().default(20),
        }))
        .handler(async ({ input }: any) => {
            return await pinLikeController.getPinLikes(input.pinId, input.page, input.limit);
        }),

    // Check if user liked a pin
    checkPinLiked: public_permission
        .route({
            path: "/pinLike/checkPinLiked",
            method: "GET",
            tags: ["PinLike"]
        })
        .input(z.object({
            pinId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            return await pinLikeController.checkPinLiked(input.pinId, context);
        }),
};

