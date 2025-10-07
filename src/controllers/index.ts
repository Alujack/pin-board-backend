import { AuthController } from "./auth.controller.js"
import { SessionController } from "./session.controller.js"
import { UserController } from "./user.controller.js"


const userController = new UserController()
const authController = new AuthController()
const sessionController = new SessionController()
export {
    authController,
    userController,
    sessionController
}