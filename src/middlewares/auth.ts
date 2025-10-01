import { Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt-token-util"
import { UserController } from "../controllers/user.controller"
import { IRequest } from "../types/user.type"
import { RoleEnum } from "../types/enums"


const userController = new UserController()
export const auth = async ( 
    req: IRequest, 
    res: Response, 
    next: NextFunction
) => {
 const token = req.headers['authorization']?.replace('Bearer ', '')
  if(!token) {
    res.status(401).json({ msg: "token is missing"})
    return
 }
 try {
    
    //specify return type because verify token return any
    const decode = verifyToken(token) as { id: string, role: string }
    const user = await userController.getOneUser(decode.id)
    if(!user){
        res.status(401).json({ msg: "User not found!"})
    }
    req.user = user
    next()
 } catch(err: any) {
    res.status(500).json({ msg: `Internal Server Error ${err}`})
 }
}

export const permission = async (roles: RoleEnum) => {
    return (req: IRequest, res: Response, next: NextFunction) => {
        if(!roles.includes(req.user?.role as string)) {
            return res.status(403).json({
                msg: "Forbibden"
            })
        }
    next()
    }
}