import { Router, Request, Response } from "express";
import { UserController } from "../controllers/user.controller";
const userRoute = Router()
const userController = new UserController()
userRoute.get('', async (req: Request, res: Response) =>  {
    const users = await userController.getUser()
    res.json(users)
})

export default userRoute