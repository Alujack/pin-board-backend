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
import { pinService } from "../services/pin.service.js";
import { handleError } from "../utils/error.util.js";

export const pinController = {
  // Get pins with pagination and filtering
  async getPins(query: PinQuery, context: any): Promise<PinListResponse> {
    try {
      return await pinService.getPins(query, context.user?._id);
    } catch (error: any) {
      throw handleError(error);
    }
  },

  // Get a single pin by ID
  async getPinById(id: string, context: any): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      return await pinService.getPinById(id, context.user?._id);
    } catch (error: any) {
      throw handleError(error);
    }
  },

  // Update a pin
  async updatePin(id: string, updateData: UpdatePinRequest, context: any): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      return await pinService.updatePin(id, updateData, context.user._id);
    } catch (error: any) {
      throw handleError(error);
    }
  },

  // Delete a pin
  async deletePin(id: string, context: any): Promise<{ success: boolean; message: string }> {
    try {
      return await pinService.deletePin(id, context.user._id);
    } catch (error: any) {
      throw handleError(error);
    }
  },

  // Assign tags to a pin
  async assignTags(id: string, tagData: AssignTagsRequest, context: any): Promise<{ success: boolean; message: string; data: PinResponse }> {
    try {
      return await pinService.assignTags(id, tagData.tagIds, context.user._id);
    } catch (error: any) {
      throw handleError(error);
    }
  },
};