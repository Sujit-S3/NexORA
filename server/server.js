// NexORA — Server Entry Point

require('dotenv').config();

const validateEnv = require('./src/config/env');
const connectDB = require('./src/config/db');
const { connectCloudinary } = require('./src/config/cloudinary');
const app = require('./src/app');

// ── 1. Validate all environment variables ────────────────────────────────
validateEnv();

// ── 2. Connect to external services ─────────────────────────────────────
connectDB();
connectCloudinary();

// ── 3. Start HTTP server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n🚀  NexORA API running on port ${PORT}`);
  console.log(`📌  Environment  : ${process.env.NODE_ENV}`);
  console.log(`🔗  API Base URL : http://localhost:${PORT}/api`);
  console.log(`💊  Health check : http://localhost:${PORT}/api/health\n`);
});

// ── Unhandled rejections ─────────────────────────────────────────────────
process.on('unhandledRejection', (err) => {
  console.error(`❌  Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// ── Uncaught exceptions ──────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error(`❌  Uncaught Exception: ${err.message}`);
  process.exit(1);
});
