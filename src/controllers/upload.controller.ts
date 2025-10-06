import { Request } from "express";
import upload from "../config/multer.js";
import { uploadService } from "../services/media/upload.service.js";

export const uploadController = {
  async uploadSingle(req: Request) {
    console.log("this is a log", req.body.image);
    return new Promise((resolve, reject) => {
      const singleUpload = upload.single("image");
      singleUpload(req, {} as any, async (err) => {
        if (err) return reject(err);
        try {
          const result = await uploadService.uploadSingle(req.file);
          resolve({
            success: true,
            message: "Image uploaded successfully",
            data: result,
          });
        } catch (error: any) {
          reject({ success: false, message: error.message });
        }
      });
    });
  },

  async uploadMultiple(req: Request) {
    return new Promise((resolve, reject) => {
      const multiUpload = upload.array("images", 5);
      multiUpload(req, {} as any, async (err) => {
        if (err) return reject(err);
        try {
          const result = await uploadService.uploadMultiple(req.files as Express.Multer.File[]);
          resolve({
            success: true,
            message: "Images uploaded successfully",
            data: result,
          });
        } catch (error: any) {
          reject({ success: false, message: error.message });
        }
      });
    });
  },
};
