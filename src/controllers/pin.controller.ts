import { 
  UpdatePinRequest,
  PinQuery,
  AssignTagsRequest,
  PinListResponse,
  PinResponse
} from "../types/pin.type.js";
import { pinService } from "../services/pin.service.js";
import { mediaService } from "../services/media/media.service.js";
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

  // Get pins created by the authenticated user (with pagination)
  async getCreatedPins(query: PinQuery, context: any): Promise<PinListResponse> {
    try {
      const userId = context.user?._id;
      // Force the user filter to the authenticated user
      const effectiveQuery: PinQuery = { ...query, user: userId } as PinQuery;
      return await pinService.getPins(effectiveQuery, userId);
    } catch (error: any) {
      throw handleError(error);
    }
  },
  // Resolve media URL for a pin id or public id (returns JSON URL) - useful for OpenAPI/docs
  async getMediaUrl(idOrPublicId: string) {
    try {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrPublicId);
      if (isObjectId) {
        const items = await mediaService.getMediaByPinId(idOrPublicId);
        if (!items || items.length === 0) throw new Error('No media found for this pin');
        return { success: true, message: 'Media URL resolved', data: { media_url: items[0].media_url, public_id: items[0].public_id } };
      }
      const item = await mediaService.getMediaByPublicId(idOrPublicId);
      if (!item) throw new Error('Media not found');
      return { success: true, message: 'Media URL resolved', data: { media_url: item.media_url, public_id: item.public_id } };
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
  // Save a pin to user's saved pins
  async savePinToUser(id: string, context: any) {
    try {
      return await pinService.savePinToUser(id, context.user._id);
    } catch (error: any) {
      throw handleError(error);
    }
  },

  // Get all saved pins for the authenticated user
async getSavedPins(context: any) {
  try {
    return await pinService.getSavedPins(context.user._id);
  } catch (error: any) {
    throw handleError(error);
  }
},

async unsavePinFromUser(id: string, context: any) {
  try {
    return await pinService.unsavePinFromUser(id, context.user._id);
  } catch (error: any) {
    throw handleError(error);
  }
},

// Get all media for saved pins of the authenticated user
async getSavedPinsMedia(context: any) {
  try {
    return await pinService.getSavedPinsMedia(context.user._id);
  } catch (error: any) {
    throw handleError(error);
  }
},

// Get all image media for pins created by the authenticated user
async getCreatedPinsImageMedia(context: any) {
  try {
    return await pinService.getCreatedPinsImageMedia(context.user._id);
  } catch (error: any) {
    throw handleError(error);
  }
}
};