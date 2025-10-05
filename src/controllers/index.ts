import { AuthController } from "./auth.controller.js"
import { UserController } from "./user.controller.js"


const userController = new UserController()
const authController = new AuthController()
export {
    authController,
    userController
}