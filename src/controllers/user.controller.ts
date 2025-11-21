import { ORPCError } from "@orpc/client";
import { hashPassword } from "../config/password.config.js";
import { UserQuery, TypeCreateUser } from "../types/user.type.js";
import { userModel } from "../models/user.model.js";
import { followModel } from "../models/follow.model.js";
import { pinModel } from "../models/pin.model.js";
import { ObjectId } from "mongodb";

export class UserController {
    async getAllUsers(query: UserQuery) {
        const users = await userModel.find(query).select("-password")
        return users
    }

    async getOneUser(id: string) {
        const user = await userModel.findOne({ _id: id }).select("-password")
        return user
    }

    async getOneForSession(id: string) {
        const user = await userModel.findOne({ _id: id }).select("username status role").lean()
        if(!user){
            throw new ORPCError("USER_NOT_FOUND", { message: "user not found"})
        }
        return {
            _id: user._id.toString(),
            username: user.username,
            name: user.username,
            status: user.status,
            role: user.role,
        }
    }

    async createUser(data: TypeCreateUser) {
        try {
            const findOne = await userModel.findOne({ username: data.username })
            if (findOne) {
                return new ORPCError("BAD_REQUEST", { message: "error username already exist" })
            }
            const hashedPassword = await hashPassword(data.password)
            data.password = hashedPassword
            const result = await userModel.create({
                _id: new ObjectId(),
                username: data.username,
                password: data.password,
                role: data.role
            })
            return result
        } catch (err: any) {
            console.log(err)
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: `error ${err}` })
        }
    }

    // Get user profile with stats
    async getUserProfile(userId: string, context: any) {
        try {
            const user = await userModel.findById(userId).select("-password");
            if (!user) {
                throw new ORPCError("NOT_FOUND", { message: "User not found" });
            }

            // Get stats
            const followersCount = await followModel.countDocuments({ following: userId });
            const followingCount = await followModel.countDocuments({ follower: userId });
            const pinsCount = await pinModel.countDocuments({ user: userId });

            // Check if current user is following this user
            let isFollowing = false;
            if (context.user?._id) {
                const follow = await followModel.findOne({
                    follower: context.user._id,
                    following: userId,
                });
                isFollowing = !!follow;
            }

            return {
                success: true,
                message: "User profile retrieved successfully",
                data: {
                    ...user.toObject(),
                    followersCount,
                    followingCount,
                    pinsCount,
                    isFollowing,
                },
            };
        } catch (err: any) {
            if (err instanceof ORPCError) {
                throw err;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: err.message });
        }
    }

    // Update user profile
    async updateUserProfile(updateData: any, context: any) {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            const allowedFields = ["full_name", "bio", "website", "location", "profile_picture"];
            const filteredData: any = {};
            
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    filteredData[field] = updateData[field];
                }
            }

            const updatedUser = await userModel
                .findByIdAndUpdate(userId, filteredData, { new: true })
                .select("-password");

            if (!updatedUser) {
                throw new ORPCError("NOT_FOUND", { message: "User not found" });
            }

            return {
                success: true,
                message: "Profile updated successfully",
                data: updatedUser,
            };
        } catch (err: any) {
            if (err instanceof ORPCError) {
                throw err;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: err.message });
        }
    }

    // Get current user profile
    async getCurrentUser(context: any) {
        try {
            const userId = context.user._id;
            if (!userId) {
                throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
            }

            const user = await userModel.findById(userId).select("-password");
            if (!user) {
                throw new ORPCError("NOT_FOUND", { message: "User not found" });
            }

            // Get stats
            const followersCount = await followModel.countDocuments({ following: userId });
            const followingCount = await followModel.countDocuments({ follower: userId });
            const pinsCount = await pinModel.countDocuments({ user: userId });

            return {
                success: true,
                message: "Current user retrieved successfully",
                data: {
                    ...user.toObject(),
                    followersCount,
                    followingCount,
                    pinsCount,
                },
            };
        } catch (err: any) {
            if (err instanceof ORPCError) {
                throw err;
            }
            throw new ORPCError("INTERNAL_SERVER_ERROR", { message: err.message });
        }
    }
}