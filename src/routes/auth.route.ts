import { Router, Response, Request } from "express";
import { AuthController } from "../controllers/auth.controller";
const authRoute = Router()
const authController = new AuthController()
authRoute.get('', async (req: Request, res: Response) => {
    const { username, password } = req.body()
    const login = await authController.login(username, password)
    if(!login){
        res.status(500).send("Internal Server Error")
    }
    res.json(login)
} )

export default authRoute