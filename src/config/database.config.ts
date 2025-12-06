import { ORPCError } from '@orpc/client';
import dotenv from 'dotenv'
import mongoose, { Mongoose } from "mongoose";
dotenv.config()

const MONGODB_URI: string = process.env.DATABASE_URI ?? "";

export const databaseConnection = async () => {
    if(!MONGODB_URI) {
        throw new ORPCError("BAD_REQUEST", {message:"missing environment variable"})
    }
    try {
        const connection: Mongoose = await mongoose.connect(MONGODB_URI)
        if(!connection) {
            console.log("couldn't connect to database")
        }
        console.log("✅ Connect to", connection.connection.name, "successfully")
    } catch (error: any) {
            throw new ORPCError("BAD_REQUEST", {message:`missing environment variable ${error}`})
    }
}
