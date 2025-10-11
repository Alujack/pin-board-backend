import { pinModel } from "../models/pin.model.js";
import { boardModel } from "../models/board.model.js";
import { userModel } from "../models/user.model.js";
import { tagModel } from "../models/tag.model.js";
import { pinTagModel } from "../models/pin-tag.model.js";
import { interactionModel } from "../models/interaction.model.js";
import { uploadService } from "../services/media/upload.service.js";
import { 
  createPinRequestSchema, 
  updatePinRequestSchema,
  pinQuerySchema,
  assignTagsRequestSchema,
  CreatePinRequest,
  UpdatePinRequest,
  PinQuery,
  AssignTagsRequest,
  CreatePinResponse,
  PinListResponse,
  PinResponse
} from "../types/pin.type.js";
import { zPin } from "../models/pin.model.js";
import { ORPCError } from "@orpc/client";
import { ObjectId } from "mongodb";

export const pinController = {
  // Get pins with pagination and filtering
  async getPins(query: PinQuery, context: any): Promise<PinListResponse> {
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

      return {
        success: true,
        message: "Pins retrieved successfully",
        data: pins as unknown as PinResponse[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },

  // Get a single pin by ID
  async getPinById(id: string, context: any): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      const pin = await pinModel
        .findById(id)
        .populate([
          { path: "user", select: "username profile_picture" },
          { path: "board", select: "name is_public" },
          { path: "tags", select: "name" },
        ]);

      if (!pin) {
        throw new ORPCError("NOT_FOUND", { message: "Pin not found" });
      }

      return {
        success: true,
        message: "Pin retrieved successfully",
        data: pin as unknown as PinResponse,
      };
    } catch (error: any) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },

  // Update a pin
  async updatePin(id: string, updateData: UpdatePinRequest, context: any): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      const userId = context.user._id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
      }

      // Check if pin exists and belongs to user
      const pin = await pinModel.findById(id);
      if (!pin) {
        throw new ORPCError("NOT_FOUND", { message: "Pin not found" });
      }

      if (pin.user.toString() !== userId.toString()) {
        throw new ORPCError("FORBIDDEN", { message: "You don't have permission to update this pin" });
      }

      // Update pin
      const updatedPin = await pinModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate([
          { path: "user", select: "username profile_picture" },
          { path: "board", select: "name is_public" },
        ]);

      return {
        success: true,
        message: "Pin updated successfully",
        data: updatedPin as unknown as PinResponse,
      };
    } catch (error: any) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },

  // Delete a pin
  async deletePin(id: string, context: any): Promise<{ success: boolean; message: string }> {
    try {
      const userId = context.user._id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
      }

      // Check if pin exists and belongs to user
      const pin = await pinModel.findById(id);
      if (!pin) {
        throw new ORPCError("NOT_FOUND", { message: "Pin not found" });
      }

      if (pin.user.toString() !== userId.toString()) {
        throw new ORPCError("FORBIDDEN", { message: "You don't have permission to delete this pin" });
      }

      // Delete pin (this will also delete related pin-tag associations due to cascade)
      await pinModel.findByIdAndDelete(id);

      return {
        success: true,
        message: "Pin deleted successfully",
      };
    } catch (error: any) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },

  // Assign tags to a pin
  async assignTags(id: string, tagData: AssignTagsRequest, context: any): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      const userId = context.user._id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
      }

      // Check if pin exists and belongs to user
      const pin = await pinModel.findById(id);
      if (!pin) {
        throw new ORPCError("NOT_FOUND", { message: "Pin not found" });
      }

      if (pin.user.toString() !== userId.toString()) {
        throw new ORPCError("FORBIDDEN", { message: "You don't have permission to modify this pin" });
      }

      // Verify all tags exist
      const tags = await tagModel.find({ _id: { $in: tagData.tagIds } });
      if (tags.length !== tagData.tagIds.length) {
        throw new ORPCError("BAD_REQUEST", { message: "One or more tags not found" });
      }

      // Remove existing pin-tag associations
      await pinTagModel.deleteMany({ pin: id });

      // Create new pin-tag associations
      const pinTagAssociations = tagData.tagIds.map(tagId => ({
        pin: id,
        tag: tagId,
      }));

      await pinTagModel.insertMany(pinTagAssociations);

      // Return updated pin with tags
      const updatedPin = await pinModel
        .findById(id)
        .populate([
          { path: "user", select: "username profile_picture" },
          { path: "board", select: "name is_public" },
          { path: "tags", select: "name" },
        ]);

      return {
        success: true,
        message: "Tags assigned successfully",
        data: updatedPin as unknown as PinResponse,
      };
    } catch (error: any) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },
};