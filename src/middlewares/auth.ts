import { Response, NextFunction } from "express"
import { ORPCError } from "@orpc/server"
import { IRequest } from "../types/user.type.js"
import { UserController } from "../controllers/user.controller.js"
import { RoleEnum } from "../types/enums.js"
import { TypeId } from "../types/common.js"
import { verifyToken } from "../utils/jwt-token-util.js"



const userController = new UserController()
export const auth = async (
    req: IRequest,
    res: Response,
    next: NextFunction
) => {
    const token = req.headers['authorization']?.replace('Bearer ', '')
    if (!token) {
        res.status(401).json({ msg: "token is missing" })
        return
    }
    try {

        //specify return type because verify token return any
        const decode = verifyToken(token) as { id: TypeId, role: string }
        const user = await userController.getOneUser(decode.id)
        if (!user) {
            throw new ORPCError("UNAUTHORIZED",{ message: "unauthorized"})
        }
        req.user = user
        next()
    } catch (err: any) {
        res.status(500).json({ msg: `Internal Server Error ${err}` })
    }
}

export const permission = async (roles: RoleEnum) => {
    return (req: IRequest, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role as string)) {
            return res.status(403).json({
                msg: "Forbibden"
            })
        }
        next()
    }
}