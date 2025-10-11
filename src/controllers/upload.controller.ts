import { Request, Response } from "express";
import { pinModel } from "../models/pin.model.js";
import { boardModel } from "../models/board.model.js";
import { uploadService } from "../services/media/upload.service.js";
import { ORPCError } from "@orpc/client";
import { ObjectId } from "mongodb";

export const uploadController = {
  // Upload single image (existing functionality)
  async uploadSingle(req: Request, res: Response): Promise<Response | void> {
    try {
      const result = await uploadService.uploadSingle(req.file);
      res.json({ success: true, message: "Image uploaded successfully", data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Upload multiple images (existing functionality)
  async uploadMultiple(req: Request, res: Response): Promise<Response | void> {
    try {
      const result = await uploadService.uploadMultiple(req.files as Express.Multer.File[]);
      res.json({ success: true, message: "Images uploaded successfully", data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Create pin with media upload
  async createPinWithMedia(req: Request, res: Response): Promise<Response | void> {
    try {
      // Validate request body
      const { board, title, description, link_url } = req.body;
      
      if (!board || !title) {
        return res.status(400).json({
          success: false,
          message: "Board ID and title are required"
        });
      }

      // Check if files are uploaded
      const files = req.files as Express.Multer.File[];
      console.log('Files received:', files?.length);
      console.log('File details:', files?.map(f => ({ name: f.originalname, mimetype: f.mimetype, size: f.size })));
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one media file is required"
        });
      }

      // Check if user is authenticated
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }

      // Check if board exists and belongs to user
      const boardDoc = await boardModel.findById(board);
      if (!boardDoc) {
        return res.status(404).json({
          success: false,
          message: "Board not found"
        });
      }

      if (boardDoc.user.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to add pins to this board"
        });
      }

      // Create pin document first to get the ID
      const pinData = {
        board,
        user: userId,
        title,
        description: description || "",
        link_url: link_url || "",
        _id: new ObjectId(),
      };

      const newPin = new pinModel(pinData);
      await newPin.save();

      try {
        // Upload media files using the pin ID
        const uploadResults = await uploadService.uploadPinMedia(files, newPin._id.toString());
        
        // Populate the response
        await newPin.populate([
          { path: "user", select: "username profile_picture" },
          { path: "board", select: "name is_public" }
        ]);

        // Add media URLs to the response
        const responseData = {
          ...newPin.toObject(),
          media: uploadResults
        };

        res.status(201).json({
          success: true,
          message: "Pin created successfully",
          data: responseData
        });
      } catch (uploadError) {
        // If upload fails, delete the created pin
        await pinModel.findByIdAndDelete(newPin._id);
        throw uploadError;
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error"
      });
    }
  },
};