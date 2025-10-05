import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { TypeId } from '../types/common.js'
import { ORPCError } from '@orpc/client'
dotenv.config()
const jwtSecret: string = process.env.JWT_SECRET || ""
const jwtExpireDuration: number = parseInt(process.env.JWT_EXPIRE_DURATION!)
export const generateTokens = (id: TypeId, role: string) => {
    if (!jwtExpireDuration){
        throw new ORPCError("BAD_REQUEST", {message:"missing environment variable"})
    }
    return jwt.sign({ id, role}, jwtSecret, { expiresIn: jwtExpireDuration })
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, jwtSecret)
}