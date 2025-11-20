import { AuthController } from "./auth.controller.js"
import { SessionController } from "./session.controller.js"
import { UserController } from "./user.controller.js"
import { pinController } from "./pin.controller.js"
import { boardController } from "./board.controller.js"
import { uploadController } from "./upload.controller.js"
import { notificationController } from "./notification.controller.js"
import { commentController } from "./comment.controller.js"
import { pinLikeController } from "./pin-like.controller.js"
import { followController } from "./follow.controller.js"
import { feedController } from "./feed.controller.js"
import { boardCollaboratorController } from "./board-collaborator.controller.js"
import { shareController } from "./share.controller.js"


const userController = new UserController()
const authController = new AuthController()
const sessionController = new SessionController()
export {
    authController,
    userController,
    sessionController,
    pinController,
    boardController,
    uploadController,
    notificationController,
    commentController,
    pinLikeController,
    followController,
    feedController,
    boardCollaboratorController,
    shareController
}