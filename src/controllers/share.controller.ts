import { ORPCError } from "@orpc/client";
import { pinModel } from "../models/pin.model.js";
import { interactionModel } from "../models/interaction.model.js";
import { InteractionTypeEnum } from "../types/enums.js";
import { ObjectId } from "mongodb";

export const shareController = {
    // Track pin share
    async sharePin(pinId: string, context: any): Promise<{ success: boolean; message: string; shareUrl: string }> {
        try {
            const userId = context.user?._id;

            // Check if pin exists
            const pin = await pinModel.findById(pinId);
            if (!pin) {
                throw new ORPCError("NOT_FOUND", { message: "Pin not found" });
            }

            // Track interaction if user is authenticated
            if (userId) {
                // Check if interaction exists
                let interaction = await interactionModel.findOne({
                    user: userId,
                    pin: pinId,
                });

                if (interaction) {
                    // Add SHARE to interaction types if not already present
                    if (!interaction.interactionType.includes(InteractionTypeEnum.SHARE)) {
                        interaction.interactionType.push(InteractionTypeEnum.SHARE);
                        await interaction.save();
                    }
                } else {
                    // Create new interaction
                    await interactionModel.create({
                        _id: new ObjectId(),
                        user: userId,
                        pin: pinId,
                        interactionType: [InteractionTypeEnum.SHARE],
                    });
                }
            }

            // Generate share URL (you can customize this based on your frontend URL)
            const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pin/${pinId}`;

            return {
                success: true,
                message: "Pin share tracked successfully",
                shareUrl,
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Get share count for a pin
    async getShareCount(pinId: string): Promise<{ success: boolean; shareCount: number }> {
        try {
            const shareCount = await interactionModel.countDocuments({
                pin: pinId,
                interactionType: InteractionTypeEnum.SHARE,
            });

            return {
                success: true,
                shareCount,
            };
        } catch (error: any) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },

    // Generate shareable link with metadata
    async generateShareLink(pinId: string): Promise<{ success: boolean; message: string; data: any }> {
        try {
            const pin = await pinModel.findById(pinId).populate([
                { path: "user", select: "username profile_picture" },
                { path: "board", select: "name" }
            ]);

            if (!pin) {
                throw new ORPCError("NOT_FOUND", { message: "Pin not found" });
            }

            const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pin/${pinId}`;

            return {
                success: true,
                message: "Share link generated successfully",
                data: {
                    url: shareUrl,
                    title: pin.title,
                    description: pin.description,
                    image: pin.link_url, // You might want to use the actual media URL here
                    author: pin.user,
                },
            };
        } catch (error: any) {
            if (error instanceof ORPCError) {
                throw error;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
        }
    },
};

