import { public_permission } from "../config/orpc.js";
import { shareController } from "../controllers/share.controller.js";
import z from "zod";

export const shareRoute = {
    // Track pin share
    sharePin: public_permission
        .route({
            path: "/share/sharePin",
            method: "POST",
            tags: ["Share"]
        })
        .input(z.object({
            pinId: z.string(),
        }))
        .handler(async ({ input, context }: any) => {
            return await shareController.sharePin(input.pinId, context);
        }),

    // Get share count for a pin
    getShareCount: public_permission
        .route({
            path: "/share/getShareCount",
            method: "GET",
            tags: ["Share"]
        })
        .input(z.object({
            pinId: z.string(),
        }))
        .handler(async ({ input }: any) => {
            return await shareController.getShareCount(input.pinId);
        }),

    // Generate shareable link
    generateShareLink: public_permission
        .route({
            path: "/share/generateShareLink",
            method: "GET",
            tags: ["Share"]
        })
        .input(z.object({
            pinId: z.string(),
        }))
        .handler(async ({ input }: any) => {
            return await shareController.generateShareLink(input.pinId);
        }),
};

