import { ORPCError } from "@orpc/client"
import { verifyPassword } from "../config/password.config.js"
import { LoginZod, TSignUp } from "../types/auth.type.js"
import { sessionController, userController } from "./index.js"
import { userModel } from "../models/user.model.js"
import { RoleEnum } from "../types/enums.js"
import { sessioinModel } from "../models/session.model.js"
import { environment } from "../environment.js"


export class AuthController {
    async login(data: LoginZod) {
        const user = await userModel.findOne({ username: data.username })
        if (!user) {
            throw new ORPCError("BAD_REQUEST", { message: "username not found!" })
        }

        const isMatchedPassword = await verifyPassword(user.password, data.password)
        if (!isMatchedPassword) {
            throw new ORPCError("BAD_REQUEST", "invalid passwrod")
        }

        const session = await sessionController.createSession(user._id.toString())
        return {
            user,
            session
        }
    }

    async register(data: TSignUp) {
        const existUser = await userModel.findOne({ username: data.username })
        if (existUser) {
            throw new ORPCError("BAD_REQUEST", { message: "this username is alreay used" })
        }
        const signedUserUp = await userController.createUser({
            username: data.username,
            password: data.password,
            role: RoleEnum.USER,
        })
        // console.log(signedUserUp)
        return signedUserUp
    }

    async refreshSession(sessionId: string) {
        try {
            const session = await sessioinModel.findOne({ token: sessionId.toString() })
            console.log(session)
            if (!session) {
                throw new ORPCError("UNAUTHORIZED", {
                    message: "session not found"
                })
            }

            if (session.expiredAt < new Date()) {
                throw new ORPCError("UNAUTHORIZED", {
                    message: "token expired"
                })
            }
            const newExpiryDate = new Date(
                Date.now() + environment.JWT_EXPIRE_DURATION * 1000
            )
            session.expiredAt = newExpiryDate;
            await session.save();
            return {
                sessionId: session._id.toString(),
                sessionToken: session.token,
                expiresAt: session.expiredAt.toISOString(),
            }
        } catch (err: any) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
                message: `internal server error ${err}`
            }
            )
        }

    }

}
