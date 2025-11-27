import { public_permission, protected_permission, ppr } from "../config/orpc.js"
import { userController } from "../controllers/index.js"
import { idZod } from "../types/common.js"
import { userQuery } from "../types/user.type.js"
import z from "zod"

const path = "/users"
const tag = ["User"]

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
    }),

    // Get user profile with stats
    getUserProfile: public_permission
    .route({
        path: `${path}/profile/:userId`,
        method: "GET",
        tags: tag
    })
    .input(z.object({
        userId: z.string()
    }))
    .handler(async({ input, context }: any) => {
        return await userController.getUserProfile(input.userId, context)
    }),

    // Get current user profile
    getCurrentUser: ppr([])
    .route({
        path: `${path}/me`,
        method: "GET",
        tags: tag
    })
    .handler(async({ context }: any) => {
        return await userController.getCurrentUser(context)
    }),

    // Update user profile
    updateProfile: ppr([])
    .route({
        path: `${path}/profile`,
        method: "PUT",
        tags: tag
    })
    .input(z.object({
        full_name: z.string().optional(),
        bio: z.string().optional(),
        website: z.string().optional(),
        location: z.string().optional(),
        profile_picture: z.string().optional()
    }))
    .handler(async({ input, context }: any) => {
        return await userController.updateUserProfile(input, context)
    })
}

