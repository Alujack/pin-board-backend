import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zPinLike = zModel.extend({
    pin: zId().ref("Pin"),
    user: zId().ref("User"),
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

// Create compound index to prevent duplicate likes
const schema = zodSchema(zPinLike, schemaOptions)
schema.index({ pin: 1, user: 1 }, { unique: true });

const pinLikeModel = model("PinLike", schema)
export { zPinLike, pinLikeModel };
export type TypePinLike = z.infer<typeof zPinLike>

