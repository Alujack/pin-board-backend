import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zBoard = zModel.extend({
    user: zId().ref("User"),
    name: z.string().min(1).max(255),
    description: z.string().min(1).max(1000).optional(),
    is_public: z.boolean().default(true),
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

const schema = zodSchema(zBoard, schemaOptions)
const boardModel = model("Board", schema)
export { zBoard, boardModel };
export type TypeBoard = z.infer<typeof zBoard>
