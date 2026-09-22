import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import path from 'path'; // Added to safely parse file extensions
import { ENV } from './env.js';

let isCloudinaryConfigured = false;

if (ENV.CLOUDINARY.CLOUD_NAME && ENV.CLOUDINARY.API_KEY && ENV.CLOUDINARY.API_SECRET) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY.CLOUD_NAME,
    api_key: ENV.CLOUDINARY.API_KEY,
    api_secret: ENV.CLOUDINARY.API_SECRET,
    secure: true,
  });
  isCloudinaryConfigured = true;
} else {
  console.warn('Cloudinary credentials not provided. Using simulated document URLs in development mode.');
}

/**
 * Upload a file buffer directly to Cloudinary using upload_stream.
 *
 * @param {Buffer} fileBuffer - The file buffer from multer.
 * @param {string} originalname - Original file name.
 * @param {string} folder - Target folder in Cloudinary.
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = (fileBuffer, originalname, folder = 'playce/official_letters') => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error('No file buffer provided for upload.'));
    }

    // Clean and sanitize the original name for both fallback and primary use
    const safeOriginalName = originalname || 'document';
    const cleanName = safeOriginalName.replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!isCloudinaryConfigured) {
      // In development / test without active credentials, simulate uploaded document URL
      const simulatedUrl = `https://cloudinary.com{Date.now()}/${folder}/${cleanName}`;
      console.log(`[Cloudinary Dev Mode] Simulated upload for "${safeOriginalName}": ${simulatedUrl}`);
      return resolve({
        secure_url: simulatedUrl,
        public_id: `${folder}/${cleanName}`,
      });
    }

    // Extract the base filename without its extension to pass as the public_id
    const fileBaseName = path.parse(cleanName).name;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        public_id: fileBaseName, // Sets the identifier using your original filename
        use_filename: true,      // Tells Cloudinary to prioritize the original filename structure
        unique_filename: true,   // Appends a random suffix to prevent files from overwriting each other
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(error);
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
};

export default {
  cloudinary,
  uploadToCloudinary,
};
