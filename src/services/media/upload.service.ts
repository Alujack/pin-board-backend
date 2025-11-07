import cloudinary from "../../config/cloudinary.config.js";
import { Readable } from "stream";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";
import axios from 'axios';
import FormData from 'form-data';
import { ORPCError } from "@orpc/client";
import { ObjectId } from "mongodb";
import { pinModel } from "../../models/pin.model.js";
interface UploadResult {
  url: string;
  filename: string;
  public_id: string;
  format: string;
  resource_type: string;
}

interface PinUploadResult {
  media_url: string;
  thumbnail_url?: string;
  public_id: string;
  format: string;
  resource_type: string;
}

// Helper function to check if file is video
const isVideo = (mimetype: string): boolean => {
  return mimetype.startsWith('video/');
};

// Helper function to check if file is image
const isImage = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};

// Generate thumbnail from video using ffmpeg
const generateVideoThumbnail = async (videoBuffer: Buffer, outputPath: string): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const tempVideoPath = path.join(process.cwd(), 'temp', `temp_video_${uuidv4()}.mp4`);
    const tempThumbnailPath = path.join(process.cwd(), 'temp', `temp_thumb_${uuidv4()}.jpg`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempVideoPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write video buffer to temporary file
    fs.writeFileSync(tempVideoPath, videoBuffer);

    // Use ffmpeg to generate thumbnail
    const ffmpeg = spawn('ffmpeg', [
      '-i', tempVideoPath,
      '-ss', '00:00:01.000', // Extract frame at 1 second
      '-vframes', '1',
      '-q:v', '2',
      '-y', // Overwrite output file
      tempThumbnailPath
    ]);

    ffmpeg.on('close', (code) => {
      // Clean up temp video file
      if (fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }

      if (code === 0) {
        // Read thumbnail and clean up
        const thumbnailBuffer = fs.readFileSync(tempThumbnailPath);
        fs.unlinkSync(tempThumbnailPath);
        resolve(thumbnailBuffer);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}`));
      }
    });

    ffmpeg.on('error', (error) => {
      // Clean up temp files
      if (fs.existsSync(tempVideoPath)) {
        fs.unlinkSync(tempVideoPath);
      }
      if (fs.existsSync(tempThumbnailPath)) {
        fs.unlinkSync(tempThumbnailPath);
      }
      reject(error);
    });
  });
};

// Upload buffer to Cloudinary
const uploadBufferToCloudinary = async (
  buffer: Buffer, 
  folder: string, 
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            filename: result.original_filename || publicId,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type,
          });
        }
      }
    );

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
};

export const uploadService = {
  async uploadSingle(file?: Express.Multer.File): Promise<UploadResult> {
    if (!file) throw new ORPCError("BAD_REQUEST", {
      message: "file not found!"
    });

    const vectorize = await this.vectorizePins(file.buffer, file.originalname)
    if(!vectorize){
      throw new ORPCError("BAD_REQUEST", {
        message: "invalid file"
      })
    }

    const id = new ObjectId()
    await uploadBufferToCloudinary(file.buffer, id.toString(), file.filename)
    console.log(vectorize)
    return {
      url: file.path,
      filename: file.filename,
      public_id: (file as any).public_id || file.filename,
      format: file.mimetype.split('/')[1],
      resource_type: file.mimetype.split('/')[0],
    };
  },

  async uploadMultiple(files?: Express.Multer.File[]): Promise<UploadResult[]> {
    if (!files || files.length === 0) throw new Error("No files uploaded");

    return files.map((file) => ({
      url: file.path,
      filename: file.filename,
      public_id: (file as any).public_id || file.filename,
      format: file.mimetype.split('/')[1],
      resource_type: file.mimetype.split('/')[0],
    }));
  },

  async uploadPinMedia(
    files: Express.Multer.File[], 
    pinId: string
  ): Promise<PinUploadResult[]> {
    if (!files || files.length === 0) throw new Error("No files uploaded");

    const results: PinUploadResult[] = [];
    const folder = `pins/${pinId}`;

    for (const file of files) {
      try {
        const publicId = `${pinId}_${Date.now()}`;
        
        if (isImage(file.mimetype) || file.mimetype === 'text/plain') {
          // Handle image upload (including text files for testing)
          console.log('Uploading file:', file.originalname, 'Size:', file.buffer.length);
          const result = await uploadBufferToCloudinary(
            file.buffer,
            folder,
            publicId,
            'image'
          );
          console.log(file.buffer)
          const vectorize = await this.vectorizePins(file.buffer, file.originalname)
          await pinModel.updateOne({_id: pinId}, {
            $set: { pin_vector: vectorize }
          },
          {
            runValidators: true
          }
        )

          results.push({
            media_url: result.url,
            public_id: result.public_id,
            format: result.format,
            resource_type: result.resource_type,
          });

        } else if (isVideo(file.mimetype)) {
          // Handle video upload
          const videoResult = await uploadBufferToCloudinary(
            file.buffer,
            folder,
            publicId,
            'video'
          );

          // Generate thumbnail for video
          try {
            const thumbnailBuffer = await generateVideoThumbnail(file.buffer, '');
            const thumbnailResult = await uploadBufferToCloudinary(
              thumbnailBuffer,
              folder,
              `${publicId}_thumb`,
              'image'
            );

            results.push({
              media_url: videoResult.url,
              thumbnail_url: thumbnailResult.url,
              public_id: videoResult.public_id,
              format: videoResult.format,
              resource_type: videoResult.resource_type,
            });
          } catch (thumbnailError) {
            console.warn('Failed to generate thumbnail:', thumbnailError);
            // Still return video without thumbnail
            results.push({
              media_url: videoResult.url,
              public_id: videoResult.public_id,
              format: videoResult.format,
              resource_type: videoResult.resource_type,
            });
          }
        } else {
          throw new Error(`Unsupported file type: ${file.mimetype}`);
        }
      } catch (error) {
        console.error(`Error uploading file ${file.originalname}:`, error);
        throw new Error(`Failed to upload ${file.originalname}`);
      }
    }

    return results;
  },

   async vectorizePins(buffer: Buffer, filename: string) {
    try {
      const formData = new FormData();
      
      // Append buffer to form data
      formData.append('file', buffer, {
        filename: filename,
        contentType: 'image/jpeg' // or dynamically set based on file.mimetype
      });

      const response = await axios.post(
        `http://127.0.0.1:8000/vectorize-pins`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
        }
      );

      return response.data.vector;
    } catch (error: any) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `internal server error: ${error}`
      });
    }
  }

};
