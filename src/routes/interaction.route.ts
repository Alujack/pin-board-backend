import { ppr } from "../config/orpc.js"
import { interactionController } from "../controllers/index.js"
import { pathIdZod } from "../types/common.js"
import { createInteraction, updateInteraction } from "../types/interaction.type.js"

const path = "/interaction"
const tags = ["Interactions"]

export const interactionRoute = {
    getAll: ppr([])
        .route({
            path: `${path}/all-interactions`,
            method: "GET",
            tags: tags
        })
        .handler(async ({ context }) => {
            const user = context.user._id
            return await interactionController.getAll(user!)
        }),

    getAllPin: ppr([])
        .route({
            path: `${path}`,
            method: "GET",
            tags: tags
        })
        .handler( async ({ context }) => {
            return await interactionController.getAllInteraction()
        }),

    createOne: ppr([])
        .route({
            path: `${path}`,
            method: "POST",
            tags: tags
        })
        .input(createInteraction)
        .handler(async ({ input, context }) => {
            return await interactionController.createOne(input, context.user._id!)
        }),

    getOne: ppr([])
        .route({
            path: `${path}/:id`,
            method: "GET",
            tags: tags
        })
        .input(pathIdZod)
        .handler(async ({ input }) => {
            const id = input.id
            return await interactionController.getOne(id)
        }),
    
    updateOne: ppr([])
        .route({
            path: `${path}/:id`,
            method: "PATCH",
            tags: tags
        })
        .input(updateInteraction)
        .handler(async ({ input }) => {
            return await interactionController.updateOne(input)
        }),
    
    onClickPin: ppr([])
        .route({
            path: `${path}/on-interact`,
            method: "PATCH",
            tags: tags
        })
        .input(updateInteraction)
        .handler(async ({ input, context }) => {
            const user = context.user._id
            return await interactionController.updateInteractionType(input, user!)
        }),
    
    onClickUnlike: ppr([])
        .route({
            path: `${path}/on-interact-unlike`,
            method: "PATCH",
            tags: tags
        })
        .input(updateInteraction)
        .handler(async ({ input, context }) => {
            const user = context.user._id
            return await interactionController.onInteractionUnlike(input, user!)
        } )
        
}