import dayjs from "dayjs";
import { ObjectId } from "mongodb";
import { environment } from "../environment.js";
import { generateTokensSession } from "../utils/jwt-token-util.js";
import { sessioinModel } from "../models/session.model.js";
import { TypeUser } from "../models/user.model.js";
import { ORPCError } from "@orpc/client";

export class SessionController {
    async createSession(userId: string) {
        const id = new ObjectId()
        const expiredAt = dayjs()
            .add(environment.JWT_EXPIRE_DURATION, "second")
            .toDate()
        const token = generateTokensSession(userId)
        const session = new sessioinModel({
            _id: id,
            user: userId,
            token,
            expiredAt,
        })
        const doc = await session.save()
        return {
            sessionId: doc._id,
            sessionToken: doc.token,
            expiredAt: doc.expiredAt.toISOString()
        }
    }

    async getSessionById(sessionId: string) {
        try {
            console.log("==>", sessionId)
            const session = await sessioinModel.findOne({
                token: sessionId.toString(),
                status: "active",
                expiredAt: { $gt: new Date() }
            }).populate("user", "username status role")
            if (!session) {
                return null
            }
            const user = session.user as any as TypeUser
            return {
                _id: user._id?.toString(),
                username: user.username,
                status: user.status,
                role: user.role
            }
        } catch (err: any) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: `internal server error ${err}` })
        }

    }

}