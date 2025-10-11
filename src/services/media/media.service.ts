import cloudinary from "../../config/cloudinary.config.js";

export interface MediaItem {
  media_url: string;
  thumbnail_url?: string;
  public_id: string;
  format: string;
  resource_type: string;
}

export const mediaService = {
  /**
   * Get all media files for a specific pin from Cloudinary
   */
  async getMediaByPinId(pinId: string): Promise<MediaItem[]> {
    try {
      // Search for resources in the pin's folder
      const folder = `pins/${pinId}`;
      
      const result = await cloudinary.search
        .expression(`folder:${folder}`)
        .max_results(50)
        .execute();

      const mediaItems: MediaItem[] = [];

      for (const resource of result.resources) {
        // Skip thumbnail files (they have _thumb suffix)
        if (resource.public_id.includes('_thumb')) {
          continue;
        }

        const mediaItem: MediaItem = {
          media_url: resource.secure_url,
          public_id: resource.public_id,
          format: resource.format,
          resource_type: resource.resource_type,
        };

        // If it's a video, look for its thumbnail
        if (resource.resource_type === 'video') {
          const thumbnailId = `${resource.public_id}_thumb`;
          try {
            const thumbnailResult = await cloudinary.search
              .expression(`public_id:${thumbnailId}`)
              .execute();
            
            if (thumbnailResult.resources.length > 0) {
              mediaItem.thumbnail_url = thumbnailResult.resources[0].secure_url;
            }
          } catch (error) {
            console.warn(`Thumbnail not found for ${resource.public_id}`);
          }
        }

        mediaItems.push(mediaItem);
      }

      return mediaItems;
    } catch (error) {
      console.error('Error fetching media for pin:', pinId, error);
      // Return empty array instead of throwing error
      return [];
    }
  },

  /**
   * Get a single media item by public ID
   */
  async getMediaByPublicId(publicId: string): Promise<MediaItem | null> {
    try {
      const result = await cloudinary.search
        .expression(`public_id:${publicId}`)
        .execute();

      if (result.resources.length === 0) {
        return null;
      }

      const resource = result.resources[0];
      return {
        media_url: resource.secure_url,
        public_id: resource.public_id,
        format: resource.format,
        resource_type: resource.resource_type,
      };
    } catch (error) {
      console.error('Error fetching media by public ID:', publicId, error);
      return null;
    }
  },

  /**
   * Delete all media for a specific pin
   */
  async deleteMediaByPinId(pinId: string): Promise<boolean> {
    try {
      const folder = `pins/${pinId}`;
      
      const result = await cloudinary.search
        .expression(`folder:${folder}`)
        .execute();

      if (result.resources.length === 0) {
        return true;
      }

      const publicIds = result.resources.map((resource:any) => resource.public_id);
      
      await cloudinary.api.delete_resources(publicIds);
      return true;
    } catch (error) {
      console.error('Error deleting media for pin:', pinId, error);
      return false;
    }
  }
};
