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
    pin_vector: z.array(z.number()).optional()
})

const schema = zodSchema(zPin, schemaOptions)
// Add a text index for title/description to support fast text search
try {
    schema.index({ title: 'text', description: 'text' }, { weights: { title: 5, description: 1 } });
} catch (err) {
    // ignore if index already exists or if zod-mongoose schema doesn't support it at runtime
    console.warn('Could not create text index on Pin schema', err);
}
const pinModel = model("Pin", schema)
export { zPin, pinModel };
export type TypePin = z.infer<typeof zPin>
