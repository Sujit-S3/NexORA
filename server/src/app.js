// NexORA — Express Application Setup

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');

const apiRoutes = require('./routes/index');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ── Security middleware ──────────────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Request parsing ──────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Data sanitization against NoSQL injection ────────────────────────────
app.use(mongoSanitize());

// ── HTTP request logging ─────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ── Rate limiting ────────────────────────────────────────────────────────
app.use('/api', apiLimiter);

// ── API routes ───────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Root endpoint ────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🛒 Welcome to the NexORA API',
    docs: `${process.env.CLIENT_ORIGIN}/api/health`,
  });
});

// ── 404 catch-all ────────────────────────────────────────────────────────
app.use(notFound);

// ── Global error handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
