import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { InteractionTypeEnum } from "../types/enums.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zInteraction = zModel.extend({
    user: zId().ref("User"),
    pin: zId().ref("Pin"),
    interactionType: z.array(z.enum([
        InteractionTypeEnum.LIKE,
        InteractionTypeEnum.CLICK,
        InteractionTypeEnum.SAVE,
        InteractionTypeEnum.SHARE,
        InteractionTypeEnum.COMMENT
    ])),
    createdAt: z.date().default(() => new Date()),
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

const schema = zodSchema(zInteraction, schemaOptions)
const interactionModel = model("Interaction", schema)
export { zInteraction, interactionModel };
export type TypeInteraction = z.infer<typeof zInteraction>
