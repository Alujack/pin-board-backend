interface UploadResult {
  url: string;
  filename: string;
}

export const uploadService = {
  async uploadSingle(file?: Express.Multer.File): Promise<UploadResult> {
    if (!file) throw new Error("No file uploaded");

    return {
      url: file.path,
      filename: file.filename,
    };
  },

  async uploadMultiple(files?: Express.Multer.File[]): Promise<UploadResult[]> {
    if (!files || files.length === 0) throw new Error("No files uploaded");

    return files.map((file) => ({
      url: file.path,
      filename: file.filename,
    }));
  },
};
