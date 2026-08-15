import { describe, expect, it } from 'vitest';
import {
  MAX_PRODUCT_IMAGE_BYTES,
  isRealProductImage,
  validateProductImages,
} from './productImages';

describe('validateProductImages', () => {
  it('accepts supported product images within the size and slot limits', () => {
    const files = [
      new File(['jpeg'], 'front.jpg', { type: 'image/jpeg' }),
      new File(['webp'], 'detail.webp', { type: 'image/webp' }),
    ];

    const result = validateProductImages(files, 2);

    expect(result.accepted).toEqual(files);
    expect(result.error).toBe('');
  });

  it('rejects unsupported, oversized, and excess files before previewing', () => {
    const unsupported = new File(['gif'], 'animated.gif', { type: 'image/gif' });
    const oversized = new File(
      [new Uint8Array(MAX_PRODUCT_IMAGE_BYTES + 1)],
      'huge.png',
      { type: 'image/png' },
    );
    const valid = new File(['png'], 'front.png', { type: 'image/png' });

    const result = validateProductImages([unsupported, oversized, valid], 0);

    expect(result.accepted).toHaveLength(0);
    expect(result.error).toMatch(/JPEG, PNG, or WebP/);
    expect(result.error).toMatch(/5 MB/);
    expect(result.error).toMatch(/Only 10/);
  });

  it('distinguishes merchant media from generated and fallback artwork', () => {
    expect(isRealProductImage({
      url: 'https://res.cloudinary.com/nexora/image/upload/product.webp',
      publicId: 'nexora/products/product',
    })).toBe(true);
    expect(isRealProductImage({
      url: '/assets/luxury/generated/reference.svg',
      publicId: 'generated-reference',
    })).toBe(false);
    expect(isRealProductImage({
      url: '/assets/luxury/fallbacks/fashion-fallback.webp',
      publicId: 'fallback',
    })).toBe(false);
  });
});
