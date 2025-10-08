import { Context, ORPCError, os } from "@orpc/server";
import { sessionController, userController } from "../controllers/index.js";

const o = os.$context<Context>()
export const public_permission = o

const requireAuth = o.middleware(async ({ context, next }) => {
    if(!context.session) {
        throw new ORPCError("UNAUTHORIZED")
    }
    return next({ context })  
})

export const permission_role = public_permission.use(requireAuth)
export const ppr = (roles: string[]) => permission_role.use(async ({ context, next }) => {
    if(!context.session){
        throw new ORPCError("UNAUTHORIZED")
    }
    // console.log(context.session)
    const session = await sessionController.getSessionById(context.session)
    if(!session) {
        throw new ORPCError("UNAUTHORIZED")
    }
    const user = await userController.getOneForSession(session._id)
    if(roles.length === 0){
        return next({
            context: {
                ...context,
                user: user
            }
        })
    }
    const userRoles = user.role as string
    const hasRole = roles.some((role) => userRoles.includes(role))
    if(!hasRole) {
        throw new ORPCError("FORBIDDEN")
    }
    return next({
        context: {
            ...context,
            user: user
        }
    })
})