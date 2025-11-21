import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zComment = zModel.extend({
    pin: zId().ref("Pin"),
    user: zId().ref("User"),
    content: z.string().min(1).max(500),
    parent_comment: zId().ref("Comment").optional(), // For nested replies
    likes: z.array(zId().ref("User")).default([]),
    is_deleted: z.boolean().default(false),
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

const schema = zodSchema(zComment, schemaOptions)
const commentModel = model("Comment", schema)
export { zComment, commentModel };
export type TypeComment = z.infer<typeof zComment>

