import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
dotenv.config()
const saltRound: number = parseInt(process.env.SALT_ROUND!)
export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, saltRound)
}

export const verifyPassword = async (userPassword: string, inputPassword: string) => {
    return await bcrypt.compare(inputPassword, userPassword)
}