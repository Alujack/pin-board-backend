import z from "zod";
import { zBoard } from "../models/board.model.js";
import { mediaItemSchema } from "./pin.type.js";

// Request types for creating a board
export const createBoardRequestSchema = z.object({
  name: z.string().min(1, "Board name is required").max(255, "Board name too long"),
  description: z.string().max(1000, "Description too long").optional(),
  is_public: z.boolean().default(true),
});

// Request types for updating a board
export const updateBoardRequestSchema = z.object({
  name: z.string().min(1, "Board name is required").max(255, "Board name too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  is_public: z.boolean().optional(),
});

// Response types
export const boardResponseSchema = zBoard.extend({
  _id: z.string(),
  user: z.object({
    _id: z.string(),
    username: z.string(),
    profile_picture: z.string().optional(),
  }),
  pins: z.array(z.object({
    _id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    link_url: z.string().optional(),
    createdAt: z.date(),
    media: z.array(mediaItemSchema).optional(),
  })).optional(),
  pinCount: z.number().default(0),
});

// Board creation response
export const createBoardResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: boardResponseSchema,
});

// Board list response
export const boardListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(boardResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

// Board query parameters
export const boardQuerySchema = z.object({
  page: z.string().default("1"),
  limit: z.string().default("10"),
  user: z.string().optional(),
  search: z.string().optional(),
  is_public: z.string().optional(),
  sort: z.enum(["newest", "oldest", "popular"]).default("newest"),
});

// Export types
export type CreateBoardRequest = z.infer<typeof createBoardRequestSchema>;
export type UpdateBoardRequest = z.infer<typeof updateBoardRequestSchema>;
export type BoardResponse = z.infer<typeof boardResponseSchema>;
export type CreateBoardResponse = z.infer<typeof createBoardResponseSchema>;
export type BoardListResponse = z.infer<typeof boardListResponseSchema>;
export type BoardQuery = z.infer<typeof boardQuerySchema>;
