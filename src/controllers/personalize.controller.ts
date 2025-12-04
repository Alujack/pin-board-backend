import { ORPCError } from "@orpc/client";
import { interactionModel } from "../models/interaction.model.js";
import { pinModel } from "../models/pin.model.js";

export class PersonalizeControllr {
    async getPersonalizePins(userId: string) {
        return await this.CalculateVector(userId)
    }

    async CalculateVector(userId: string) {
        try {
            const allPins = await pinModel.find({
                user: {
                    $ne: userId
                }
            }).select('pin_vector')
            const interaction = await interactionModel.findOne({
                user: userId,
            }).select("pin")
            const originPin = await pinModel.findOne({ _id: interaction?.pin })
            const pinVector = originPin?.pin_vector


            const score: any[] = []

            allPins.forEach((pin) => {
                let res = this.cosineSimilarity(pinVector, pin.pin_vector)
                score.push({ [res]: pin._id })
            })


            // const scoreKeys = score.map(obj => parseFloat(Object.keys(obj)[0]))
            // console.log(scoreKeys)  Array of your similarity scores
            // const sortTedScore = this.sortScore(scoreKeys)
            // console.log(sortTedScore)

            return score
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

    sortScore(data: number[]) {
        return data.sort()
    }
}