import { public_permission } from "../config/orpc.js"
import { authController } from "../controllers/index.js"
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
    .handler( async ({ input }) => {
        console.log("==>  ", input)
        return await authController.register(input)
    } )
}