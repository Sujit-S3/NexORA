// NexORA — Currency Formatter

// Fixed exchange rates (Base: INR)
const EXCHANGE_RATES = {
  INR: 1,
  USD: 0.012,
  GBP: 0.0094,
  EUR: 0.011,
  AED: 0.044
};

const LOCALES = {
  INR: 'en-IN',
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'de-DE',
  AED: 'ar-AE'
};

/**
 * Format a number as a currency string.
 * @param {number} amountInINR - Amount to format (Base INR)
 * @param {string} currency - ISO 4217 currency code (default: 'INR')
 * @returns {string} Formatted currency string, e.g. "₹1,299.00"
 */
export const formatCurrency = (amountInINR, currency = 'INR') => {
  if (amountInINR === null || amountInINR === undefined) return '—';
  
  const rate = EXCHANGE_RATES[currency] || 1;
  const locale = LOCALES[currency] || 'en-IN';
  const convertedAmount = amountInINR * rate;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(convertedAmount);
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
