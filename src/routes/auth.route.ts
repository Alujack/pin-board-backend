import { ppr, public_permission } from "../config/orpc.js"
import { authController, userController } from "../controllers/index.js"
import { loginZod, zSignUp } from "../types/auth.type.js"

const path = "/auth"
const tags = ["Auth"]
export const authRoute = {
    login: public_permission
    .route({
        path: `${path}/login`,
        method: "POST",
        tags: tags
    })
    .input(loginZod)
    .handler( async ({ input }) => {
        return await authController.login(input)
    }),

    register: public_permission
    .route({
        path: `${path}/register`,
        method: "POST",
        tags: tags
    })
    .input(zSignUp)
    .handler(async ({ input }) => {
        return await authController.register(input)
    }),

    profile: ppr([])
    .route({
        path: `${path}/me`,
        method: "GET",
        tags: tags
    })
    .handler( async ({ context }) => {
        const id = context.user._id
        console.log("==>",id)
        return await userController.getOneUser(id.toString())
    }),

    refreshToken: ppr([])
    .route({
        path: `${path}/refresh`,
        method: "POST",
        tags: tags,
    })
    .handler( async ({ context }) => {
        const session = context.session
        return await authController.refreshSession(session)
    })
    
}