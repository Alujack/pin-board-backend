import { Request, Response } from "express"
export type ExpressContext = {
    request: Request,
    response: Response
}

export async function createContext(req: Request, res: Response){
    const authorization = req.headers['authorization']
    const token = authorization?.replace("Bearer ", "")
    if(!token){
        return {
            session: null
        }
    }
    return {
        session: token
    }
}

export type Context = Awaited<ReturnType<typeof createContext>>