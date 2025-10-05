import { ORPCError } from "@orpc/client"
import { verifyPassword } from "../config/password.config.js"
import { LoginZod, TSignUp } from "../types/auth.type.js"
import { generateTokens } from "../utils/jwt-token-util.js"
import { userController } from "./index.js"
import { userModel } from "../models/user.model.js"
import { RoleEnum } from "../types/enums.js"


export class AuthController {
    async login(data: LoginZod) {
       const user = await userModel.findOne({ username: data.username })
       if(!user) {
        throw new ORPCError("BAD_REQUEST", { message: "username not found!" })
       }

       const isMatchedPassword = await verifyPassword(user.password, data.password)
       if(!isMatchedPassword){
        throw new ORPCError("BAD_REQUEST", "invalid passwrod")
       }

       const token = generateTokens(user.id, user.role)
       return {
        user,
        accessToken: token
       }
    }

    async register(data: TSignUp){
        const existUser = await userModel.findOne({ username: data.username })
        if(existUser){
            throw new ORPCError("BAD_REQUEST", { message: "this username is alreay used"})
        }
        const signedUserUp = await userController.createUser({
            username: data.username,
            password: data.password,
            role: RoleEnum.USER,
        })
        console.log(signedUserUp)
        return signedUserUp
    }
}
