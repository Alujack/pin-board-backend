import path from "path";
import { interactionModel } from "../models/interaction.model.js";
import { InteractionTypeEnum } from "../types/enums.js";
import { TypeCreateInteraction, TypeUpdateInteraction, TypeUpdateInteractionType } from "../types/interaction.type.js";
import { handleError } from "../utils/error.util.js";
import { ObjectId } from "mongodb";

export class InteractionController {


    async getAllInteraction() {
        try {
            const results = await interactionModel.find().populate("user")
            return results
        } catch (err: any) {
            throw handleError(err)
        }
    }

    async getAll(userID: string) {
        try { 
            const interactions = await interactionModel.find({
                user: userID
            }).populate("user")
            return {
                total: interactions.length,
                list: interactions
            }
        } catch (err: any) {
            throw handleError(err)
        }
    }

    async createOne(data: TypeCreateInteraction, user: string) {
        try {
            const { pin, interactionType } = data
            const result = await interactionModel.create({
                _id: new ObjectId(),
                user: user,
                pin: pin,
                interactionType: interactionType
            })
            return result
        } catch (err: any) {
            throw handleError(err)
        }
    }

    async getOne(id: string) {
        try {
            const result = await interactionModel.findById(id)
            return result
        } catch (err: any) {
            throw handleError(err)
        }
    }

    async updateOne(data: TypeUpdateInteraction) {
        try {
            const result = await interactionModel.findByIdAndUpdate(data._id, data)
            return result
        } catch (err: any) {
            throw handleError(err)
        }
    }

    async updateInteractionType(data: TypeUpdateInteractionType, user: string) {
        try {
            const { pin, interactionType } = data
            const interaction = await interactionModel.findOne({
                user: user,
                pin: pin,
            })
            if (!interaction) {
                return null
            }
            const updateResult = await interactionModel.updateOne(
                {
                    _id: interaction._id
                },
                {
                    $set: {
                        interactionType: interactionType
                    }
                }
            )
            return updateResult
        } catch (err: any) {
            throw handleError(err)
        }
    }

    async onInteractionUnlike(data: TypeUpdateInteractionType, user: string) {
        try {
            const { pin } = data
            const interaction = await interactionModel.findOne({
                user: user,
                pin: pin,
            })
            if (!interaction) {
                return null
            }
            const updateResult = await interactionModel.updateOne(
                {
                    _id: interaction._id
                },
                {
                    $set: {
                        interactionType: InteractionTypeEnum.CLICK
                    }
                }
            )
            return updateResult
        } catch (err: any) {
            throw handleError(err)
        }
    }
}