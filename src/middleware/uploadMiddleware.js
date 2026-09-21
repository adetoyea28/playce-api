import multer from 'multer';
import { sendError } from '../utils/responseHandler.js';

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Unsupported file type: ${file.mimetype}. Allowed formats are PDF, PNG, JPEG, DOC, and DOCX.`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * Middleware wrapper for single file upload that captures Multer errors cleanly.
 *
 * @param {string} fieldName - The multipart form field name (default: 'document').
 */
export const uploadSingleDocument = (fieldName = 'document') => {
  const multerSingle = upload.single(fieldName);

  return (req, res, next) => {
    multerSingle(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 400, 'Uploaded file exceeds the maximum allowed size of 10MB.');
        }
        return sendError(res, 400, `Upload error: ${err.message}`);
      } else if (err) {
        return sendError(res, 400, err.message);
      }
      next();
    });
  };
};

export default upload;
