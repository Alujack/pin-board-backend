import { RoleEnum } from "./enums"
import { Request } from "express"
export interface IUser {
    id: string
    username: string
    email: string
    passwrod: string
    role: RoleEnum
}

export interface IRequest extends Request {
    user?: IUser
}