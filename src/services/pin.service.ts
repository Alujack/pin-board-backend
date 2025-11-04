import { pinModel } from "../models/pin.model.js";
import { boardModel } from "../models/board.model.js";
import { userModel } from "../models/user.model.js";
import { tagModel } from "../models/tag.model.js";
import { pinTagModel } from "../models/pin-tag.model.js";
import { interactionModel } from "../models/interaction.model.js";
import { mediaService } from "./media/media.service.js";
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
        .limit(limit);

      // Fetch media for each pin
      const pinsWithMedia = await Promise.all(
        pins.map(async (pin) => {
          const media = await mediaService.getMediaByPinId(pin._id.toString());
          return {
            ...pin.toObject(),
            media,
          };
        })
      );

      return ResponseUtil.successWithPagination(
        pinsWithMedia as unknown as PinResponse[],
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
    userId?: string
  ): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      const pin = await pinModel.findById(id).populate([
        { path: "user", select: "username profile_picture" },
        { path: "board", select: "name is_public" },
        { path: "tags", select: "name" },
      ]);

      if (!pin) {
        throw new NotFoundError("Pin not found");
      }

      // Fetch media for the pin
      const media = await mediaService.getMediaByPinId(pin._id.toString());
      const pinWithMedia = {
        ...pin.toObject(),
        media,
      };

      return ResponseUtil.success(
        pinWithMedia as unknown as PinResponse,
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
        { path: "tags", select: "name" },
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
      const pin = await pinModel.findById(pinId);
      if (!pin) throw new NotFoundError("Pin not found");

      // Prevent saving own pin by default
      if (!allowSelfSave && pin.user && pin.user.toString() === userId) {
        throw new ForbiddenError("You cannot save your own pin");
      }

      // Add to user's saved_pins if not already present
      await userModel.updateOne(
        { _id: userId, saved_pins: { $ne: pinId } },
        { $push: { saved_pins: pinId } }
      );

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
};
