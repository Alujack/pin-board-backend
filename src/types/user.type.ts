import z from "zod"
import { Request } from "express"
import { TypeUser, zUser } from "../models/user.model.js"
import { RoleEnum } from "./enums.js"

declare module "express-serve-static-core" {
    interface Request {
        user?: TypeUser
    }
}

export const userQuery = z.object({
    search: z.string().optional(),
    role: z.enum([RoleEnum.ADMIN, RoleEnum.USER]).optional(),
})

export type UserQuery = z.infer<typeof userQuery>

const createUser = zUser.pick({
    role: true,
    username: true,
    password: true,
})
export interface AuthUser {
  _id: string;
  username: string;
  role: RoleEnum;
}

export type TypeCreateUser = z.infer<typeof createUser>
