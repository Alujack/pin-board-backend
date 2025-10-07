import { public_permission } from "../config/orpc.js"
import { userController } from "../controllers/index.js"
import { idZod } from "../types/common.js"
import { userQuery } from "../types/user.type.js"

const path = "/users"
const tag = ["Classroom"]
// import oc from '@orpc/client'
// const userRoute = Router()
// const userController = new UserController()
// userRoute.get('', async (req: Request, res: Response) =>  {
//     const users = await userController.getUser()
//     res.json(users)
// })

// export default userRoute

export const userRoute = {
    getAll: public_permission
    .route({
        path: `${path}`,
        method: "GET",
        tags: tag
    })
    .input(userQuery)
    .handler(async ({ input }) => {
        const user = await userController.getAllUsers(input)
        return user
    }),

    getOne: public_permission
    .route({
        path: `${path}/:id`,
        method: "GET",
        tags: tag
    })
    .input(idZod)
    .handler(async({ input }) => {
        const id = new Object(input)
        return await userController.getOneUser(id.toString())
    })
}

