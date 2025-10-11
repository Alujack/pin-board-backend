import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zPinTag = zModel.extend({
    pin: zId().ref("Pin"),
    tag: zId().ref("Tag"),
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

const schema = zodSchema(zPinTag, schemaOptions)
const pinTagModel = model("PinTag", schema)
export { zPinTag, pinTagModel };
export type TypePinTag = z.infer<typeof zPinTag>
