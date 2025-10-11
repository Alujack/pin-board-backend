import { boardModel } from "../models/board.model.js";
import { pinModel } from "../models/pin.model.js";
import { mediaService } from "../services/media/media.service.js";
import { 
  createBoardRequestSchema, 
  updateBoardRequestSchema,
  boardQuerySchema,
  CreateBoardRequest,
  UpdateBoardRequest,
  BoardQuery,
  CreateBoardResponse,
  BoardListResponse,
  BoardResponse
} from "../types/board.type.js";
import { ORPCError } from "@orpc/client";
import { ObjectId } from "mongodb";

export const boardController = {
  // Create a new board
  async createBoard(boardData: CreateBoardRequest, context: any): Promise<CreateBoardResponse> {
    try {
      const userId = context.user._id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
      }

      // Create board
      const newBoard = new boardModel({
        ...boardData,
        user: userId,
        _id: new ObjectId(),
      });

      await newBoard.save();

      // Populate the response
      await newBoard.populate([
        { path: "user", select: "username profile_picture" }
      ]);

      return {
        success: true,
        message: "Board created successfully",
        data: newBoard as unknown as BoardResponse,
      };
    } catch (error: any) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },

  // Get boards with pagination and filtering
  async getBoards(query: BoardQuery, context: any): Promise<BoardListResponse> {
    try {
      // Convert string parameters to numbers
      const page = parseInt(query.page) || 1;
      const limit = Math.min(parseInt(query.limit) || 10, 50); // Max 50 items per page

      // Build filter object
      const filter: any = {};
      
      if (query.user) {
        filter.user = query.user;
      }
      
      if (query.is_public !== undefined) {
        filter.is_public = query.is_public === "true";
      }
      
      if (query.search) {
        filter.$or = [
          { name: { $regex: query.search, $options: "i" } },
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
          // You might want to implement a popularity score based on pin count
          sort = { createdAt: -1 };
          break;
        default:
          sort = { createdAt: -1 };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count
      const total = await boardModel.countDocuments(filter);

      // Get boards
      const boards = await boardModel
        .find(filter)
        .populate([
          { path: "user", select: "username profile_picture" },
        ])
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Get pin counts for each board
      const boardsWithPinCount = await Promise.all(
        boards.map(async (board) => {
          const pinCount = await pinModel.countDocuments({ board: board._id });
          return {
            ...board.toObject(),
            pinCount,
          };
        })
      );

      return {
        success: true,
        message: "Boards retrieved successfully",
        data: boardsWithPinCount as unknown as BoardResponse[],
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

  // Get a single board by ID
  async getBoardById(id: string, context: any): Promise<{ success: boolean; message: string; data: BoardResponse }> {
    try {
      const board = await boardModel
        .findById(id)
        .populate([
          { path: "user", select: "username profile_picture" },
        ]);

      if (!board) {
        throw new ORPCError("NOT_FOUND", { message: "Board not found" });
      }

      // Get pins for this board
      const pins = await pinModel
        .find({ board: id })
        .select("_id title description link_url createdAt")
        .sort({ createdAt: -1 })
        .limit(20); // Limit to recent 20 pins

      // Fetch media for each pin
      const pinsWithMedia = await Promise.all(
        pins.map(async (pin) => {
          const media = await mediaService.getMediaByPinId(pin._id.toString());
          return {
            ...pin.toObject(),
            media
          };
        })
      );

      const pinCount = await pinModel.countDocuments({ board: id });

      const boardWithPins = {
        ...board.toObject(),
        pins: pinsWithMedia,
        pinCount,
      };

      return {
        success: true,
        message: "Board retrieved successfully",
        data: boardWithPins as unknown as BoardResponse,
      };
    } catch (error: any) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },

  // Update a board
  async updateBoard(id: string, updateData: UpdateBoardRequest, context: any): Promise<{ success: boolean; message: string; data: BoardResponse }> {
    try {
      const userId = context.user._id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
      }

      // Check if board exists and belongs to user
      const board = await boardModel.findById(id);
      if (!board) {
        throw new ORPCError("NOT_FOUND", { message: "Board not found" });
      }

      if (board.user.toString() !== userId.toString()) {
        throw new ORPCError("FORBIDDEN", { message: "You don't have permission to update this board" });
      }

      // Update board
      const updatedBoard = await boardModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate([
          { path: "user", select: "username profile_picture" },
        ]);

      // Get pin count
      const pinCount = await pinModel.countDocuments({ board: id });

      const boardWithPinCount = {
        ...updatedBoard!.toObject(),
        pinCount,
      };

      return {
        success: true,
        message: "Board updated successfully",
        data: boardWithPinCount as unknown as BoardResponse,
      };
    } catch (error: any) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },

  // Delete a board
  async deleteBoard(id: string, context: any): Promise<{ success: boolean; message: string }> {
    try {
      const userId = context.user._id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
      }

      // Check if board exists and belongs to user
      const board = await boardModel.findById(id);
      if (!board) {
        throw new ORPCError("NOT_FOUND", { message: "Board not found" });
      }

      if (board.user.toString() !== userId.toString()) {
        throw new ORPCError("FORBIDDEN", { message: "You don't have permission to delete this board" });
      }

      // Delete all pins in this board first
      await pinModel.deleteMany({ board: id });

      // Delete board
      await boardModel.findByIdAndDelete(id);

      return {
        success: true,
        message: "Board deleted successfully",
      };
    } catch (error: any) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },

  // Get user's boards
  async getUserBoards(context: any): Promise<{ success: boolean; message: string; data: BoardResponse[] }> {
    try {
      const userId = context.user._id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", { message: "User not authenticated" });
      }

      const boards = await boardModel
        .find({ user: userId })
        .populate([
          { path: "user", select: "username profile_picture" },
        ])
        .sort({ createdAt: -1 });

      // Get pin counts for each board
      const boardsWithPinCount = await Promise.all(
        boards.map(async (board) => {
          const pinCount = await pinModel.countDocuments({ board: board._id });
          return {
            ...board.toObject(),
            pinCount,
          };
        })
      );

      return {
        success: true,
        message: "User boards retrieved successfully",
        data: boardsWithPinCount as unknown as BoardResponse[],
      };
    } catch (error: any) {
      if (error instanceof ORPCError) {
        throw error;
      }
      throw new ORPCError("INTERNAL_SERVER_ERROR", { message: error.message });
    }
  },
};
