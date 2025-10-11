import z from "zod";
import { zPin } from "../models/pin.model.js";

// Request types for creating a pin
export const createPinRequestSchema = z.object({
  board: z.string().min(1, "Board ID is required"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  link_url: z.string().url("Invalid URL format").optional(),
});

// Request types for updating a pin
export const updatePinRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long").optional(),
  description: z.string().max(1000, "Description too long").optional(),
  link_url: z.string().url("Invalid URL format").optional(),
});

// Response types
export const pinResponseSchema = zPin.extend({
  _id: z.string(),
  user: z.object({
    _id: z.string(),
    username: z.string(),
    profile_picture: z.string().optional(),
  }),
  board: z.object({
    _id: z.string(),
    name: z.string(),
    is_public: z.boolean(),
  }),
  tags: z.array(z.object({
    _id: z.string(),
    name: z.string(),
  })).optional(),
  interactions: z.object({
    likes: z.number().default(0),
    saves: z.number().default(0),
    shares: z.number().default(0),
    clicks: z.number().default(0),
  }).optional(),
  thumbnail_url: z.string().optional(),
});

// Media upload response
export const mediaUploadResponseSchema = z.object({
  media_url: z.string(),
  thumbnail_url: z.string().optional(),
  public_id: z.string(),
  format: z.string(),
  resource_type: z.string(),
});

// Pin creation response
export const createPinResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: pinResponseSchema,
});

// Pin list response
export const pinListResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(pinResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }).optional(),
});

// Pin query parameters
export const pinQuerySchema = z.object({
  page: z.string().default("1"),
  limit: z.string().default("10"),
  board: z.string().optional(),
  user: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(),
  sort: z.enum(["newest", "oldest", "popular"]).default("newest"),
});

// Tag assignment request
export const assignTagsRequestSchema = z.object({
  tagIds: z.array(z.string()).min(1, "At least one tag is required"),
});

// Export types
export type CreatePinRequest = z.infer<typeof createPinRequestSchema>;
export type UpdatePinRequest = z.infer<typeof updatePinRequestSchema>;
export type PinResponse = z.infer<typeof pinResponseSchema>;
export type MediaUploadResponse = z.infer<typeof mediaUploadResponseSchema>;
export type CreatePinResponse = z.infer<typeof createPinResponseSchema>;
export type PinListResponse = z.infer<typeof pinListResponseSchema>;
export type PinQuery = z.infer<typeof pinQuerySchema>;
export type AssignTagsRequest = z.infer<typeof assignTagsRequestSchema>;
