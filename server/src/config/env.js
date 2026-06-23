// NexORA — Environment Variable Validation
// Validates all required env vars at startup so we fail fast.

const required = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const validateEnv = () => {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌  Missing required environment variables:\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }

  console.log('✅  Environment variables validated');
};

module.exports = validateEnv;
