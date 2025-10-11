import dotenv from 'dotenv'
dotenv.config()
export const environment = {
    JWT_EXPIRE_DURATION: parseInt(process.env.JWT_EXPIRE_DURATION || ""),
    JWT_SECRET: process.env.JWT_SECRET || "your-secret-key"
}