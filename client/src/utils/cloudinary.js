// NexORA — Cloudinary responsive delivery helper
// Uploads are stored at a single fixed resolution (see server/src/middleware/upload.js);
// this inserts a delivery-time transformation so small renders (grid thumbnails,
// cards) don't download a full-size asset meant for a PDP hero.

const CLOUDINARY_UPLOAD_MARKER = '/upload/';

/**
 * Appends a Cloudinary transformation segment to a delivery URL.
 * Non-Cloudinary URLs (local fallback images, etc.) are returned unchanged.
 * @param {string} url
 * @param {{ width?: number }} options
 */
export function getOptimizedImageUrl(url, { width = 400 } = {}) {
  if (!url || typeof url !== 'string' || !url.includes(CLOUDINARY_UPLOAD_MARKER)) {
    return url;
  }
  const transform = `w_${width},q_auto,f_auto`;
  return url.replace(CLOUDINARY_UPLOAD_MARKER, `${CLOUDINARY_UPLOAD_MARKER}${transform}/`);
}
