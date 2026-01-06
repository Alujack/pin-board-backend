import { pinModel } from "../models/pin.model.js";
import { boardModel } from "../models/board.model.js";
import { userModel } from "../models/user.model.js";
import { tagModel } from "../models/tag.model.js";
import { pinTagModel } from "../models/pin-tag.model.js";
import { interactionModel } from "../models/interaction.model.js";
import { pinLikeModel } from "../models/pin-like.model.js";
import { mediaService } from "./media/media.service.js";
import { notificationService } from "./notification.service.js";
import {
  CreatePinRequest,
  UpdatePinRequest,
  PinQuery,
  PinResponse,
  PinListResponse,
} from "../types/pin.type.js";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
  handleError,
} from "../utils/error.util.js";
import { ResponseUtil } from "../utils/response.util.js";
import { InteractionTypeEnum } from "../types/enums.js";
import { ORPCError } from "@orpc/client";
import { interactionController, personalizeController } from "../controllers/index.js";
import { ObjectId } from "mongodb";

export const pinService = {
  /**
   * Get pins with pagination and filtering
   */
  async getPins(query: PinQuery, userId?: string): Promise<PinListResponse> {
    try {
      // Convert string parameters to numbers
      const page = parseInt(query.page) || 1;
      const limit = Math.min(parseInt(query.limit) || 10, 50); // Max 50 items per page

      // Build filter object
      const filter: any = {};

      if (query.board) {
        // Ensure board ID is properly converted to ObjectId for filtering
        // MongoDB/Mongoose can handle string to ObjectId conversion, but being explicit ensures correctness
        try {
          filter.board = new ObjectId(query.board);
        } catch (e) {
          // If ObjectId conversion fails, use the string as-is (Mongoose will handle it)
          filter.board = query.board;
        }
      }

      if (query.user) {
        filter.user = query.user;
      }

      if (query.search) {
        filter.$or = [
          { title: { $regex: query.search, $options: "i" } },
          { description: { $regex: query.search, $options: "i" } },
        ];
      }

      // Build sort object
      let sort: any = { createdAt: -1 }; // Default to newest
      switch (query.sort) {
        case "oldest":
          sort = { createdAt: 1 };
          break;
        case "popular":
          // You might want to implement a popularity score based on interactions
          sort = { createdAt: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await pinModel.countDocuments(filter);

      // Get pins
      const pins = await pinModel
        .find(filter)
        .populate([
          { path: "user", select: "username profile_picture" },
          { path: "board", select: "name is_public" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select("-pin_vector")

      // Fetch media and like information for each pin
      const pinsWithData = await Promise.all(
        pins.map(async (pin) => {
          const media = await mediaService.getMediaByPinId(pin._id.toString());
          const likesCount = await pinLikeModel.countDocuments({ pin: pin._id });
          let isLiked = false;
          if (userId) {
            const likeDoc = await pinLikeModel.findOne({ pin: pin._id, user: userId });
            isLiked = !!likeDoc;
          }
          return {
            ...pin.toObject(),
            media,
            likesCount,
            isLiked,
          };
        })
      );

      return ResponseUtil.successWithPagination(
        pinsWithData as unknown as PinResponse[],
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        "Pins retrieved successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },


  async getPinsPersonalize(query: PinQuery, userId?: string): Promise<PinListResponse> {
    try {
      // Convert string parameters to numbers
      const page = parseInt(query.page) || 1;
      const limit = Math.min(parseInt(query.limit) || 10, 50); // Max 50 items per page

      // Build filter object
      const filter: any = {};

      if (query.board) {
        filter.board = query.board;
      }

      if (query.user) {
        filter.user = query.user;
      }

      if (query.search) {
        filter.$or = [
          { title: { $regex: query.search, $options: "i" } },
          { description: { $regex: query.search, $options: "i" } },
        ];
      }

      // Build sort object
      switch (query.sort) {
        case "oldest":
          break;
        case "popular":
          break;
        default:
      }

      // Calculate pagination

      // Get total count
      const total = await pinModel.countDocuments(filter);

      // Ask personalize controller for personalized pins (await result)
      const personalized = await personalizeController.getPersonalizePins(
        userId?.toString()!,
        null
      );

      // Normalize personalize controller response to an array of pin docs/ids
      let personalizedList: any[] = [];
      if (Array.isArray(personalized)) personalizedList = personalized as any[];
      else if (personalized && typeof personalized === "object" && Array.isArray((personalized as any).data)) personalizedList = (personalized as any).data;

      // Enrich personalized pins with media, likes and isLiked to match getPins format
      const pinsWithData = await Promise.all(
        (personalizedList || []).map(async (p: any) => {
          let pinDoc: any = p;
          if (!pinDoc) return null;

          // Personalize controller currently returns ResponseUtil-wrapped objects.
          // Unwrap to the actual pin document/response payload before accessing _id.
          if (
            pinDoc &&
            typeof pinDoc === "object" &&
            (pinDoc as any).data &&
            (pinDoc as any).data._id
          ) {
            pinDoc = (pinDoc as any).data;
          }

          // Some call sites may return { pinId } entries
          if (pinDoc && typeof pinDoc === "object" && (pinDoc as any).pinId) {
            pinDoc = (pinDoc as any).pinId;
          }

          // If personalize controller returned an id/string, fetch the pin doc
          if (typeof pinDoc === "string" || !pinDoc._id) {
            pinDoc = await pinModel
              .findById(pinDoc)
              .populate([
                { path: "user", select: "username profile_picture" },
                { path: "board", select: "name is_public" },
              ])
              .select("-pin_vector");
          }

          if (!pinDoc) return null;

          const media = await mediaService.getMediaByPinId(pinDoc._id.toString());
          const likesCount = await pinLikeModel.countDocuments({ pin: pinDoc._id });
          let isLiked = false;
          if (userId) {
            const likeDoc = await pinLikeModel.findOne({ pin: pinDoc._id, user: userId });
            isLiked = !!likeDoc;
          }

          return {
            ...(
              typeof pinDoc.toObject === "function" ? pinDoc.toObject() : pinDoc
            ),
            media,
            likesCount,
            isLiked,
          };
        })
      );

      const filteredPins = pinsWithData.filter((x: any) => x !== null);

      return ResponseUtil.successWithPagination(
        filteredPins as unknown as PinResponse[],
        {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        "Pins retrieved successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },


  

  /**
   * Get a single pin by ID
   */
  async getPinById(
    id: string,
    userId: string
  ): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      // console.log("userId ==> ",userId, id)
      const pin = await pinModel.findById(id).populate([
        { path: "user", select: "username profile_picture" },
        { path: "board", select: "name is_public" },
      ]).select("-pin_vector");

      if (!pin) {
        throw new NotFoundError("Pin not found");
      }

      // Fetch media for the pin
      const media = await mediaService.getMediaByPinId(pin._id.toString());

      // Fetch like information
      const likesCount = await pinLikeModel.countDocuments({ pin: pin._id });
      let isLiked = false;
      if (userId) {
        const likeDoc = await pinLikeModel.findOne({ pin: pin._id, user: userId });
        isLiked = !!likeDoc;
      }

      const inter = await interactionModel.findOne({
        pin: id, user: userId
      })

      if (inter) {
        if (!inter.interactionType.includes(InteractionTypeEnum.CLICK)) {
          try {
            await interactionModel.updateOne({
              _id: inter._id
            }, {
              $push: {
                interactionType: InteractionTypeEnum.CLICK
              }
            })
          } catch (err: any) {
            throw new ORPCError(err)
          }
          
        }
      } else {
        await interactionController.createOne({pin: id, interactionType: [InteractionTypeEnum.CLICK]}, userId)
      }

      const pinWithData = {
        ...pin.toObject(),
        media,
        likesCount,
        isLiked,
        inter
      };

      return ResponseUtil.success(
        pinWithData as unknown as PinResponse,
        "Pin retrieved successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  async getPinByIdPersonalize(
    id: string,
  ): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      // console.log("userId ==> ",userId, id)
      const pin = await pinModel.findById(id).populate([
        { path: "user", select: "username profile_picture" },
        { path: "board", select: "name is_public" },
      ]).select("-pin_vector");

      if (!pin) {
        throw new NotFoundError("Pin not found");
      }

      // Fetch media for the pin
      const media = await mediaService.getMediaByPinId(pin._id.toString());

      // Fetch like information
      const likesCount = await pinLikeModel.countDocuments({ pin: pin._id });
      let isLiked = false;

      const pinWithData = {
        ...pin.toObject(),
        media,
        likesCount,
        isLiked,
      };

      return ResponseUtil.success(
        pinWithData as unknown as PinResponse,
        "Pin retrieved successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Create a new pin
   */
  async createPin(
    pinData: CreatePinRequest,
    userId: string
  ): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      // Verify board exists and user has access
      const board = await boardModel.findById(pinData.board);
      if (!board) {
        throw new NotFoundError("Board not found");
      }

      if (board.user.toString() !== userId) {
        throw new ForbiddenError(
          "You don't have permission to add pins to this board"
        );
      }

      // Create pin
      const newPin = new pinModel({
        ...pinData,
        user: userId,
      });

      await newPin.save();

      // Populate the response
      await newPin.populate([
        { path: "user", select: "username profile_picture" },
        { path: "board", select: "name is_public" },
      ]);

      return ResponseUtil.created(
        newPin as unknown as PinResponse,
        "Pin created successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Update a pin
   */
  async updatePin(
    id: string,
    updateData: UpdatePinRequest,
    userId: string
  ): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      // Check if pin exists and belongs to user
      const pin = await pinModel.findById(id);
      if (!pin) {
        throw new NotFoundError("Pin not found");
      }

      if (pin.user.toString() !== userId) {
        throw new ForbiddenError(
          "You don't have permission to update this pin"
        );
      }

      // Update pin
      const updatedPin = await pinModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate([
          { path: "user", select: "username profile_picture" },
          { path: "board", select: "name is_public" },
        ]);

      return ResponseUtil.updated(
        updatedPin as unknown as PinResponse,
        "Pin updated successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Delete a pin
   */
  async deletePin(
    id: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if pin exists and belongs to user
      const pin = await pinModel.findById(id);
      if (!pin) {
        throw new NotFoundError("Pin not found");
      }

      if (pin.user.toString() !== userId) {
        throw new ForbiddenError(
          "You don't have permission to delete this pin"
        );
      }

      // Delete associated media from Cloudinary
      await mediaService.deleteMediaByPinId(id);

      // Delete pin (this will also delete related pin-tag associations due to cascade)
      await pinModel.findByIdAndDelete(id);

      return ResponseUtil.deleted("Pin deleted successfully");
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Assign tags to a pin
   */
  async assignTags(
    id: string,
    tagIds: string[],
    userId: string
  ): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      // Check if pin exists and belongs to user
      const pin = await pinModel.findById(id);
      if (!pin) {
        throw new NotFoundError("Pin not found");
      }

      if (pin.user.toString() !== userId) {
        throw new ForbiddenError(
          "You don't have permission to modify this pin"
        );
      }

      // Verify all tags exist
      const tags = await tagModel.find({ _id: { $in: tagIds } });
      if (tags.length !== tagIds.length) {
        throw new ValidationError("One or more tags not found");
      }

      // Remove existing pin-tag associations
      await pinTagModel.deleteMany({ pin: id });

      // Create new pin-tag associations
      const pinTagAssociations = tagIds.map((tagId) => ({
        pin: id,
        tag: tagId,
      }));

      await pinTagModel.insertMany(pinTagAssociations);

      // Return updated pin with tags
      const updatedPin = await pinModel.findById(id).populate([
        { path: "user", select: "username profile_picture" },
        { path: "board", select: "name is_public" },
      ]);

      return ResponseUtil.updated(
        updatedPin as unknown as PinResponse,
        "Tags assigned successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },
  /**
   * Save a pin to a user's saved_pins list and record an interaction
   */
  async savePinToUser(
    pinId: string,
    userId: string,
    allowSelfSave: boolean = false
  ) {
    try {
      // Ensure pin exists
      const pin = await pinModel.findById(pinId).populate('user');
      if (!pin) throw new NotFoundError("Pin not found");

      // Prevent saving own pin by default
      if (!allowSelfSave && pin.user && pin.user.toString() === userId) {
        throw new ForbiddenError("You cannot save your own pin");
      }

      // Add to user's saved_pins if not already present
      const updateResult = await userModel.updateOne(
        { _id: userId, saved_pins: { $ne: pinId } },
        { $push: { saved_pins: pinId } }
      );

      // Only proceed if the pin was actually added (not already saved)
      if (updateResult.modifiedCount > 0) {
        // Create interaction entry
        try {
          await interactionModel.create({
            user: userId,
            pin: pinId,
            interactionType: ["save"],
          } as any);
        } catch (err) {
          console.warn("Could not record save interaction", err);
        }

        // Send push notification to pin owner
        try {
          const saver = await userModel.findById(userId).select('username');
          if (saver && pin.user) {
            await notificationService.notifyPinSaved(
              pinId,
              pin.title || 'Untitled Pin',
              pin.user.toString(),
              saver.username,
              userId
            );
          }
        } catch (err) {
          console.warn("Could not send pin saved notification", err);
        }
      }

      return ResponseUtil.success({ pinId, userId }, "Pin saved");
    } catch (error: any) {
      throw handleError(error);
    }
  },

  // Remove a pin from a user's saved_pins and record an interaction
  async unsavePinFromUser(pinId: string, userId: string) {
    try {
      // Ensure pin exists
      const pin = await pinModel.findById(pinId);
      if (!pin) throw new NotFoundError("Pin not found");

      // Remove from user's saved_pins
      await userModel.updateOne(
        { _id: userId },
        { $pull: { saved_pins: pinId } }
      );

      // Optionally record an "unsave" interaction
      try {
        await interactionModel.create({
          user: userId,
          pin: pinId,
          interactionType: ["unsave"],
        } as any);
      } catch (err) {
        console.warn("Could not record unsave interaction", err);
      }

      return ResponseUtil.success({ pinId, userId }, "Pin unsaved");
    } catch (error: any) {
      throw handleError(error);
    }
  },

  // Get all saved pins for the authenticated user
  async getSavedPins(userId: string) {
    try {
      // Find user and populate saved pins with necessary details
      const user = await userModel
        .findById(userId)
        .populate({
          path: "saved_pins",
          populate: {
            path: "user",
            select: "username profile_picture", // Adjust fields as needed
          },
        })
        .select("saved_pins");

      if (!user) {
        throw new NotFoundError("User not found");
      }

      return ResponseUtil.success(
        {
          pins: user.saved_pins
        },
        "Saved pins retrieved successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  // Get all media items across saved pins for the authenticated user
  async getSavedPinsMedia(userId: string) {
    try {
      const user = await userModel.findById(userId).select("saved_pins");
      if (!user) {
        throw new NotFoundError("User not found");
      }

      const savedPinIds = (user.saved_pins as any[]) || [];
      const mediaArrays = await Promise.all(
        savedPinIds.map(async (pid: any) => {
          const pinId = pid.toString();
          const items = await mediaService.getMediaByPinId(pinId);
          return items.map((m) => ({ ...m, pinId }));
        })
      );

      const media = ([] as any[]).concat(...mediaArrays);

      return ResponseUtil.success(
        media,
        "Saved media retrieved successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  // Get all image media across pins created by the authenticated user
  async getCreatedPinsImageMedia(userId: string) {
    try {
      // Find pins created by the user
      const pins = await pinModel.find({ user: userId }).select("_id");
      const pinIds = pins.map((p) => p._id.toString());

      const mediaArrays = await Promise.all(
        pinIds.map(async (pinId) => {
          const items = await mediaService.getMediaByPinId(pinId);
          // Filter only images
          return items
            .filter((m) => (m as any).resource_type === "image")
            .map((m) => ({ ...m, pinId }));
        })
      );

      const media = ([] as any[]).concat(...mediaArrays);

      return ResponseUtil.success(
        media,
        "Created image media retrieved successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Get pins related to a given pin using cosine similarity on pin vectors
   */
  async getRelatedPins(pinId: string, userId?: string): Promise<PinListResponse> {
    try {
      // Fetch the target pin and its vector
      const targetPin = await pinModel.findById(pinId).select("pin_vector");
      if (!targetPin || !targetPin.pin_vector) {
        throw new NotFoundError("Pin not found or has no vector");
      }

      // Fetch all other pins with vectors (exclude the target pin)
      const allPins = await pinModel.find({ _id: { $ne: pinId } }).select("pin_vector");

      // Compute cosine similarity scores
      const scored = allPins
        .filter((pin) => 
          pin.pin_vector && 
          Array.isArray(pin.pin_vector) && 
          pin.pin_vector.length === targetPin.pin_vector!.length
        )
        .map((pin) => ({
          score: this.cosineSimilarity(targetPin.pin_vector!, pin.pin_vector!),
          pinId: pin._id,
        }));

      // Sort by similarity descending and take top 15
      scored.sort((a, b) => b.score - a.score);
      const topScored = scored.slice(0, 15);
      const topIds = topScored.map((item) => item.pinId);

      // Fetch pin documents for the top similar pins
      const relatedPins = await pinModel
        .find({ _id: { $in: topIds } })
        .populate([
          { path: "user", select: "username profile_picture" },
          { path: "board", select: "name is_public" },
        ])
        .select("-pin_vector");

      // Store scores in a map for quick lookup during enrichment
      const scoreMap = new Map<string, number>(topScored.map(s => [s.pinId.toString(), s.score]));

      // Enrich with media, likes, and isLiked
      const enriched = await Promise.all(
        relatedPins.map(async (pin) => {
          const media = await mediaService.getMediaByPinId(pin._id.toString());
          const likesCount = await pinLikeModel.countDocuments({ pin: pin._id });
          let isLiked = false;
          if (userId) {
            const likeDoc = await pinLikeModel.findOne({ pin: pin._id, user: userId });
            isLiked = !!likeDoc;
          }
            return {
              ...pin.toObject(),
              media,
              likesCount,
              isLiked,
              similarityScore: scoreMap.get(pin._id.toString()) || 0
            };
          })
        );

        // Sort the enriched results by similarity score, since MongoDB's $in doesn't preserve order
        let finalPins = enriched.sort((a, b) => (b as any).similarityScore - (a as any).similarityScore);

        // Ensure at least 15 pins; if fewer, pad with recent pins (optional fallback)
      if (finalPins.length < 15) {
        const fallbackCount = 15 - finalPins.length;
        const fallbackPins = await pinModel
          .find({ _id: { $nin: [pinId, ...finalPins.map((p) => p._id)] } })
          .populate([
            { path: "user", select: "username profile_picture" },
            { path: "board", select: "name is_public" },
          ])
          .sort({ createdAt: -1 })
          .limit(fallbackCount)
          .select("-pin_vector");

        const enrichedFallback = await Promise.all(
          fallbackPins.map(async (pin) => {
            const media = await mediaService.getMediaByPinId(pin._id.toString());
            const likesCount = await pinLikeModel.countDocuments({ pin: pin._id });
            let isLiked = false;
            if (userId) {
              const likeDoc = await pinLikeModel.findOne({ pin: pin._id, user: userId });
              isLiked = !!likeDoc;
            }
            return {
              ...pin.toObject(),
              media,
              likesCount,
              isLiked,
              similarityScore: 0
            };
          })
        );
        finalPins = [...finalPins, ...enrichedFallback];
      }

      // Catch-all slice to ensure we return exactly 15 pins if possible
      finalPins = finalPins.slice(0, 15);

      return ResponseUtil.successWithPagination(
        finalPins as unknown as PinResponse[],
        {
          page: 1,
          limit: finalPins.length,
          total: finalPins.length,
          totalPages: 1,
        },
        "Related pins retrieved successfully"
      );
    } catch (error: any) {
      throw handleError(error);
    }
  },

  /**
   * Compute cosine similarity between two vectors (shared utility)
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }
    const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
    return magnitude === 0 ? 0 : dot / magnitude;
  },
};
