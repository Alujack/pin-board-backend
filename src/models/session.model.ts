import { zId, zodSchema } from "@zodyac/zod-mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import z from "zod";
import { model } from "mongoose";

const zSession = zModel.extend({
    user: zId("User"),
    token: z.string().min(10).max(255),
    expiredAt: z.date(),
})

const schema = zodSchema(zSession, schemaOptions)
const sessioinModel = model("Session", schema)
export { zSession, sessioinModel }
export type Session = z.infer<typeof zSession>