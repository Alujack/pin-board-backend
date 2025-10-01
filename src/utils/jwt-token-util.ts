import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
const jwtSecret: string = process.env.JWT_SECRET || ""
const jwtExpireDuration: number = parseInt(process.env.JWT_EXPIRE_DURATION!)
export const generateTokens = (id: string, role: string) => {
    if (!jwtExpireDuration){
        throw new Error("missing environment variable")
    }
    return jwt.sign({ id, role}, jwtSecret, { expiresIn: jwtExpireDuration })
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, jwtSecret)
}