import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zFollow = zModel.extend({
    follower: zId().ref("User"), // User who is following
    following: zId().ref("User"), // User being followed
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})

// Create compound index to prevent duplicate follows
const schema = zodSchema(zFollow, schemaOptions)
schema.index({ follower: 1, following: 1 }, { unique: true });

const followModel = model("Follow", schema)
export { zFollow, followModel };
export type TypeFollow = z.infer<typeof zFollow>

