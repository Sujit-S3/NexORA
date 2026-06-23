// NexORA — Client-Side Validators

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

/**
 * Validate password strength.
 * Must be at least 6 characters.
 * @param {string} password
 * @returns {{ valid: boolean, message: string }}
 */
export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true, message: '' };
};

/**
 * Validate phone number (basic 10-digit Indian format).
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

/**
 * Validate Indian PIN code.
 * @param {string} pin
 * @returns {boolean}
 */
export const isValidPinCode = (pin) => /^\d{6}$/.test(pin);

/**
 * Check if a value is empty (null, undefined, empty string, or empty array).
 * @param {*} value
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Validate a complete form fields object.
 * @param {object} fields - { fieldName: value }
 * @param {object} rules - { fieldName: [{ validate: fn, message: string }] }
 * @returns {{ valid: boolean, errors: object }}
 */
export const validateForm = (fields, rules) => {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      if (!rule.validate(fields[field])) {
        errors[field] = rule.message;
        break;
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors };
};
