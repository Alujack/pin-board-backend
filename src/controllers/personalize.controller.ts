import { ORPCError } from "@orpc/client";
import { interactionModel, TypeInteraction } from "../models/interaction.model.js";
import { pinModel } from "../models/pin.model.js";
import { ZodIntersection } from "zod/v4";
import { pinController } from "./pin.controller.js";
import { pinService } from "../services/pin.service.js";

export class PersonalizeControllr {
    async getPersonalizePins(userId: string, context: any) {
        return await this.CalculateVector(userId, context)
    }

    async CalculateVector(userId: string, context: any) {
        try {
            const allPins = await pinModel.find({
                user: {
                    $ne: userId
                }
            }).select('pin_vector')
            const interactions = await interactionModel.find({
                user: userId,
            }).select("pin")

            if (interactions.length == 0) {
                return await pinController.getPins({ sort: "popular", limit: "100", page: "1" }, context)
            }

            const vector = await this.calculateAverageInteraction(interactions)

            const score: any[] = []

            allPins.forEach((pin) => {
                let res = this.cosineSimilarity(vector, pin.pin_vector)
                score.push({
                    score: res,
                    pinId: pin._id
                })
            })

            score.sort((a, b) => b.score - a.score)
            console.log(score)
            const personalizedPins = await Promise.all(
                score.map(async (item) => {
                    return await pinService.getPinByIdPersonalize(item.pinId)
                })
            )

            return personalizedPins
        } catch (err: any) {
            throw new ORPCError(err)
        }

    }

    cosineSimilarity(vecA: any, vecB: any) {
        let dot = 0;
        let magA = 0;
        let magB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
            magA += vecA[i] * vecA[i];
            magB += vecB[i] * vecB[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    async calculateAverageInteraction(interactions: TypeInteraction[]) {
        if (interactions.length == 1) {
            const interact = await pinModel.findOne({ _id: interactions[0]._id }).select("pin_vector")
            return interact?.pin_vector

        }
        const values = await Promise.all(interactions.map(async (interaction) => {
            return await pinModel.findOne({ _id: interaction.pin }).select("pin_vector")
        }))
        const averagePin: number[] = []
        // console.log(values)
        for (let i = 0; i < values[0]!.pin_vector!.length; i++) {
            let total = 0
            for (let value of values) {
                total += value!.pin_vector![i]
            }
            averagePin[i] = total / values.length
        }
        return averagePin
    }

    sortScore(data: number[]) {
        return
    }
}