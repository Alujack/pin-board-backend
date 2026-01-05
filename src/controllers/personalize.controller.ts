import { ORPCError } from "@orpc/client";
import { interactionModel, TypeInteraction } from "../models/interaction.model.js";
import { pinModel } from "../models/pin.model.js";
import { ZodIntersection } from "zod/v4";
import { pinController } from "./pin.controller.js";
import { pinService } from "../services/pin.service.js";
import { ResponseUtil } from "../utils/response.util.js";

export class PersonalizeControllr {
    async getPersonalizePins(userId: string, context: any) {
        return await this.CalculateVector(userId, context)
    }

    async CalculateVector(userId: string, context: any) {
        try {
            // Get all pins with vectors for scoring (excluding user's own pins)
            const pinsForScoring = await pinModel.find({
                user: {
                    $ne: userId
                }
            }).select('pin_vector _id')
            
            const interactions = await interactionModel.find({
                user: userId,
            }).select("pin")

            // Calculate score map for personalized pins
            const scoreMap = new Map<string, number>()
            
            if (interactions.length > 0) {
                try {
                    // Calculate personalized vector from interactions
                    const vector = await this.calculateAverageInteraction(interactions)
                    
                    if (vector && Array.isArray(vector)) {
                        // Calculate scores for pins (excluding user's own pins)
                        pinsForScoring.forEach((pin) => {
                            if (pin.pin_vector && Array.isArray(pin.pin_vector) && pin.pin_vector.length === vector.length) {
                                let res = this.cosineSimilarity(vector, pin.pin_vector)
                                scoreMap.set(pin._id.toString(), res)
                            }
                        })
                    }
                } catch (error) {
                    // If vector calculation fails, continue without personalization
                    console.error("Error calculating personalized vector:", error)
                }
            }
            // If no interactions, all pins will have score 0 and be sorted by createdAt

            // Get ALL pins using the regular getPins service (includes user's own pins and all others)
            // Use a high limit to get all pins - adjust based on your needs
            const allPinsResponse = await pinService.getPins(
                { sort: "newest", limit: "1000", page: "1" }, 
                userId
            )

            // Add scores to pins - pins with scores get their score, others get 0
            const pinsWithScores = allPinsResponse.data.map((pin: any) => {
                const pinId = pin._id?.toString() || pin._id
                const score = scoreMap.get(pinId) ?? 0 // Default score of 0 for pins without personalized scores
                return {
                    ...pin,
                    personalizedScore: score
                }
            })

            // Sort by score (highest first), then by createdAt for same scores
            pinsWithScores.sort((a: any, b: any) => {
                // First sort by personalized score (highest first)
                if (b.personalizedScore !== a.personalizedScore) {
                    return b.personalizedScore - a.personalizedScore
                }
                // If scores are equal, sort by newest first
                const dateA = new Date(a.createdAt || a.created_at || 0).getTime()
                const dateB = new Date(b.createdAt || b.created_at || 0).getTime()
                return dateB - dateA
            })

            // Remove the personalizedScore field before returning (clean up)
            const sortedPins = pinsWithScores.map(({ personalizedScore, ...pin }: any) => pin)
            
            // Return in the same format as getPins (PinListResponse) - matching /api/pins format
            return ResponseUtil.successWithPagination(
                sortedPins,
                {
                    page: 1,
                    limit: sortedPins.length,
                    total: sortedPins.length,
                    totalPages: 1
                },
                "Personalized pins retrieved successfully"
            )
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
            const interact = await pinModel.findOne({ _id: interactions[0].pin }).select("pin_vector")
            if (!interact || !interact.pin_vector) {
                throw new Error("Pin vector not found for interaction")
            }
            return interact.pin_vector
        }
        const values = await Promise.all(interactions.map(async (interaction) => {
            return await pinModel.findOne({ _id: interaction.pin }).select("pin_vector")
        }))
        
        // Filter out null values
        const validValues = values.filter(v => v && v.pin_vector && Array.isArray(v.pin_vector))
        if (validValues.length === 0) {
            throw new Error("No valid pin vectors found for interactions")
        }
        
        const averagePin: number[] = []
        const vectorLength = validValues[0]!.pin_vector!.length
        
        for (let i = 0; i < vectorLength; i++) {
            let total = 0
            for (let value of validValues) {
                total += value!.pin_vector![i]
            }
            averagePin[i] = total / validValues.length
        }
        return averagePin
    }

    sortScore(data: number[]) {
        return
    }
}