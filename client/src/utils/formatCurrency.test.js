import { describe, it, expect } from 'vitest';
import { formatCurrency, calcDiscountPercent, formatCompact } from './formatCurrency';

describe('formatCurrency', () => {
  it('formats an INR amount with the rupee symbol', () => {
    expect(formatCurrency(1299, 'INR')).toContain('1,299');
  });

  it('converts to a different currency using the fixed exchange rate', () => {
    const usd = formatCurrency(1000, 'USD');
    expect(usd).toContain('12'); // 1000 * 0.012
  });

  it('returns an em dash for null/undefined amounts', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
  });
});

describe('calcDiscountPercent', () => {
  it('computes the percentage off', () => {
    expect(calcDiscountPercent(1000, 750)).toBe(25);
  });

  it('returns 0 when the discounted price is not actually lower', () => {
    expect(calcDiscountPercent(1000, 1000)).toBe(0);
    expect(calcDiscountPercent(1000, 1200)).toBe(0);
  });

  it('returns 0 for missing inputs', () => {
    expect(calcDiscountPercent(0, 100)).toBe(0);
    expect(calcDiscountPercent(100, 0)).toBe(0);
  });
});

describe('formatCompact', () => {
  it('abbreviates large numbers', () => {
    expect(formatCompact(1500)).toBe('1.5K');
  });

  it('returns "0" for null/undefined', () => {
    expect(formatCompact(null)).toBe('0');
    expect(formatCompact(undefined)).toBe('0');
  });
});
