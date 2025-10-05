import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { RoleEnum } from "../types/enums.js";
import { zodSchema } from "@zodyac/zod-mongoose";

const zUser = zModel.extend({
    username: z.string().min(1).max(255),
    password: z.string().min(1).max(255),
    role: z.enum([RoleEnum.ADMIN, RoleEnum.USER]).default(RoleEnum.USER)
})



const schema = zodSchema(zUser, schemaOptions)
const userModel = model("User", schema)
export { zUser, userModel };
export type TypeUser = z.infer<typeof zUser>