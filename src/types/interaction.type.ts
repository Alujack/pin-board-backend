import z from "zod";
import { zInteraction } from "../models/interaction.model.js";

export const createInteraction = zInteraction.pick({
    pin: true,
    interactionType: true
})

export type TypeCreateInteraction = z.infer<typeof createInteraction>
export const updateInteraction = zInteraction.partial()
export type TypeUpdateInteraction = z.infer<typeof updateInteraction>

export type TypeUpdateInteractionType = z.infer<typeof updateInteraction>