import { describe, it, expect } from 'vitest';
import { getOptimizedImageUrl } from './cloudinary';

describe('getOptimizedImageUrl', () => {
  it('inserts a width/quality/format transform into a Cloudinary URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1234/products/watch.jpg';
    expect(getOptimizedImageUrl(url, { width: 400 })).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_400,q_auto,f_auto/v1234/products/watch.jpg',
    );
  });

  it('defaults to width 400 when no options are given', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/products/x.jpg';
    expect(getOptimizedImageUrl(url)).toContain('w_400,q_auto,f_auto/');
  });

  it('leaves non-Cloudinary URLs untouched', () => {
    const url = '/assets/local-fallback.png';
    expect(getOptimizedImageUrl(url)).toBe(url);
  });

  it('handles missing/empty input without throwing', () => {
    expect(getOptimizedImageUrl(undefined)).toBeUndefined();
    expect(getOptimizedImageUrl('')).toBe('');
  });
});
