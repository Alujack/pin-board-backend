import z from "zod";
import { model } from "mongoose";
import { schemaOptions, zModel } from "./common.model.js";
import { RoleEnum, UserStatusEnum } from "../types/enums.js";
import { zodSchema, zId } from "@zodyac/zod-mongoose";

const zUser = zModel.extend({
    username: z.string().min(1).max(255),
    password: z.string().min(1).max(255),
    profile_picture: z.string().optional(),
    role: z.enum([RoleEnum.ADMIN, RoleEnum.USER]).default(RoleEnum.USER),
    is_active: z.enum([UserStatusEnum.ACTIVE, UserStatusEnum.INACTIVE]).default(UserStatusEnum.ACTIVE)
}).omit({ _id: true }).extend({
    _id: zId().optional(),
})



const schema = zodSchema(zUser, schemaOptions)
const userModel = model("User", schema)
export { zUser, userModel };
export type TypeUser = z.infer<typeof zUser>