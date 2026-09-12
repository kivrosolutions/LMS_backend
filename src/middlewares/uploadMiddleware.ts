import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import type { Request } from 'express';
import type { StorageEngine } from 'multer';

// 1) Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2) Stream uploads directly to Cloudinary without a legacy storage adapter.
const storage: StorageEngine = {
  _handleFile(
    _req: Request,
    file: Express.Multer.File,
    callback: (error?: unknown, info?: Partial<Express.Multer.File>) => void,
  ): void {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'lms_uploads',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto',
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
      },
      (error, result) => {
        if (error) {
          callback(error);
          return;
        }

        if (!result) {
          callback(new Error('Cloudinary upload completed without a result'));
          return;
        }

        callback(null, {
          path: result.secure_url,
          filename: result.public_id,
          size: result.bytes,
        });
      },
    );

    file.stream.pipe(uploadStream);
  },
  _removeFile(
    _req: Request,
    _file: Express.Multer.File,
    callback: (error: Error | null) => void,
  ): void {
    callback(null);
  },
};

// 3) Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Increased to 5MB for documents
});

export default upload;
