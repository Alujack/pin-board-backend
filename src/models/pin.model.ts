import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zPin = zModel.extend({
    board: zId().ref("Board"),
    user: zId().ref("User"),
    title: z.string().min(1).max(255),
    description: z.string().min(1).max(1000).optional(),
    link_url: z.string().max(500).optional(),
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

const schema = zodSchema(zPin, schemaOptions)
const pinModel = model("Pin", schema)
export { zPin, pinModel };
export type TypePin = z.infer<typeof zPin>
