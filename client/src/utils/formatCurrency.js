// NexORA — Currency Formatter

/**
 * Format a number as a currency string.
 * @param {number} amount - Amount to format
 * @param {string} currency - ISO 4217 currency code (default: 'INR')
 * @param {string} locale - BCP 47 locale tag (default: 'en-IN')
 * @returns {string} Formatted currency string, e.g. "₹1,299.00"
 */
export const formatCurrency = (amount, currency = 'INR', locale = 'en-IN') => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Calculate discount percentage.
 * @param {number} original - Original price
 * @param {number} discounted - Discounted price
 * @returns {number} Percentage off (rounded)
 */
export const calcDiscountPercent = (original, discounted) => {
  if (!original || !discounted || discounted >= original) return 0;
  return Math.round(((original - discounted) / original) * 100);
};

/**
 * Format number with K/M suffix for large values.
 * e.g. 1500 → "1.5K"
 * @param {number} num
 * @returns {string}
 */
export const formatCompact = (num) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en', { notation: 'compact', compactDisplay: 'short' }).format(num);
};
