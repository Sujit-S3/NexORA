// NexORA — Multer + Cloudinary Upload Middleware
// Uses memoryStorage + cloudinary.uploader.upload_stream for Cloudinary v2 compatibility.

const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

// ── File type validation ───────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

// ── Multer with memory storage ─────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per file
    files: 10,
  },
});

/**
 * Upload a single buffer to Cloudinary using upload_stream.
 * @param {Buffer} buffer - File buffer from multer memoryStorage
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<object>} Cloudinary result { secure_url, public_id }
 */
const uploadToCloudinary = (buffer, folder = 'nexora/misc') => new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error) {return reject(new ApiError(500, `Cloudinary upload failed: ${error.message}`));}
        resolve(result);
      },
    );
    stream.end(buffer);
  });

/**
 * Delete a file from Cloudinary by public_id.
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => cloudinary.uploader.destroy(publicId);

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
