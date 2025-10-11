import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zTag = zModel.extend({
    name: z.string().min(1).max(50).toLowerCase(),
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

const schema = zodSchema(zTag, schemaOptions)
const tagModel = model("Tag", schema)
export { zTag, tagModel };
export type TypeTag = z.infer<typeof zTag>
