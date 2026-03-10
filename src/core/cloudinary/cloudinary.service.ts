import { Injectable } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 } from 'cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'src/config/env.config';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: config.cloudinary.cloud_name,
      api_key: config.cloudinary.key,
      api_secret: config.cloudinary.secret,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = v2.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) {
            reject(new Error(`Failed to upload file: ${error.message}`));
          } else {
            resolve(result);
          }
        },
      );

      uploadStream.end(file.buffer); // Use the buffer to upload the file
    });
  }
}
