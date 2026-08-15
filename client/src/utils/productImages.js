export const MAX_PRODUCT_IMAGES = 10;
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_PRODUCT_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const SYNTHETIC_PRODUCT_MEDIA = [
  '/assets/luxury/generated/',
  '/assets/luxury/fallbacks/',
  '/assets/placeholders/',
];

export function isRealProductImage(image) {
  const url = image?.url || '';
  const publicId = image?.publicId || '';
  return Boolean(url)
    && !SYNTHETIC_PRODUCT_MEDIA.some(prefix => url.includes(prefix))
    && !publicId.startsWith('generated-')
    && publicId !== 'fallback';
}

export function validateProductImages(fileList, availableSlots = MAX_PRODUCT_IMAGES) {
  const accepted = [];
  const errors = [];

  for (const file of Array.from(fileList || [])) {
    if (!ALLOWED_PRODUCT_IMAGE_TYPES.has(file.type)) {
      errors.push(`${file.name}: use JPEG, PNG, or WebP.`);
      continue;
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      errors.push(`${file.name}: maximum file size is 5 MB.`);
      continue;
    }
    if (accepted.length >= Math.max(0, availableSlots)) {
      errors.push(`Only ${MAX_PRODUCT_IMAGES} product images are allowed.`);
      break;
    }
    accepted.push(file);
  }

  return { accepted, error: errors.join(' ') };
}
