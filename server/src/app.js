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
    // x-session-id is required by the AI Concierge for anonymous session tracking
    allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-conversation-id'],
  }),
);

// ── Request parsing ──────────────────────────────────────────────────────
// The verify callback stashes the raw body bytes on req.rawBody — needed by
// the Razorpay webhook handler to compute its HMAC signature, since the
// signature is over the exact raw payload, not the re-serialized JSON.
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
// No express.urlencoded() — every endpoint here is JSON or multipart (via
// multer, which parses its own body independently). Parsing
// application/x-www-form-urlencoded was both unused *and* a CSRF vector:
// it's a CORS-safelisted content type, so a cross-origin HTML <form> can
// submit it without a preflight, and with the cross-origin production
// deployment requiring sameSite:'none' on the auth cookie (see
// generateToken.js), the browser would still attach it. Dropping this
// parser means a forged form-urlencoded submission never populates
// req.body, so it can't drive any endpoint that expects real fields.
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
// ping
