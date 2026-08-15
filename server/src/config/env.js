// NexORA — Environment Variable Validation
// Validates all required env vars at startup so we fail fast.

const required = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EXPIRES_IN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'GEMINI_API_KEY',
  'CLIENT_ORIGIN',
];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌  Missing required environment variables:\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }

  // A short/weak secret makes JWT forgery via brute force feasible.
  const MIN_SECRET_LENGTH = 32;
  if (process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    console.error(`❌  JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters (got ${process.env.JWT_SECRET.length}).`);
    process.exit(1);
  }
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < MIN_SECRET_LENGTH) {
    console.error(`❌  JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters (got ${process.env.JWT_REFRESH_SECRET.length}).`);
    process.exit(1);
  }

  // Razorpay is optional (COD always works without it), but if configured it
  // must be configured fully — a half-set pair would silently break signature checks.
  const hasKeyId = Boolean(process.env.RAZORPAY_KEY_ID);
  const hasKeySecret = Boolean(process.env.RAZORPAY_KEY_SECRET);
  if (hasKeyId !== hasKeySecret) {
    console.error('❌  RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must both be set, or both omitted.');
    process.exit(1);
  }
  if (!hasKeyId) {
    console.warn('⚠️   RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not set — online payments disabled, only Cash on Delivery will be accepted.');
  } else if (!process.env.RAZORPAY_WEBHOOK_SECRET && process.env.NODE_ENV === 'production') {
    console.error('Razorpay online payments require RAZORPAY_WEBHOOK_SECRET in production.');
    process.exit(1);
  } else if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.warn('RAZORPAY_WEBHOOK_SECRET not set - payment webhook reconciliation will reject all events.');
  }

  console.log('✅  Environment variables validated');
};

module.exports = validateEnv;
