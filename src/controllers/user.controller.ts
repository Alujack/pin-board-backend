import { ORPCError } from "@orpc/client";
import { hashPassword } from "../config/password.config.js";
import { UserQuery, TypeCreateUser } from "../types/user.type.js";
import { userModel } from "../models/user.model.js";
import { ObjectId } from "mongodb";
export class UserController {
    async getAllUsers(query: UserQuery) {
        const users = await userModel.find(query).select("-password")
        return users
    }

    async getOneUser(id: string) {
        const user = await userModel.findOne({ _id: id }).select("-password")
        return user
    }

    async getOneForSession(id: string) {
        const user = await userModel.findOne({ _id: id }).select("username status role").lean()
        if(!user){
            throw new ORPCError("USER_NOT_FOUND", { message: "user not found"})
        }
        return {
            _id: user._id.toString(),
            username: user.username,
            name: user.username,
            status: user.status,
            role: user.role,
        }
    }

    async createUser(data: TypeCreateUser) {
        try {
            const findOne = await userModel.findOne({ username: data.username })
            if (findOne) {
                return new ORPCError("BAD_REQUEST", { message: "error username already exist" })
            }
            const hashedPassword = await hashPassword(data.password)
            data.password = hashedPassword
            const result = await userModel.create({
                _id: new ObjectId(),
                username: data.username,
                password: data.password,
                role: data.role
            })
            return result
        } catch (err: any) {
            console.log(err)
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: `error ${err}` })
        }

    }
}