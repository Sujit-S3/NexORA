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
app.set('trust proxy', 1); // Required for rate limiting behind a reverse proxy (Render/Vercel)

const isProduction = process.env.NODE_ENV === 'production';

// CLIENT_ORIGIN is a comma-separated allowlist, e.g.
// "https://nex-ora-g9tg.vercel.app,https://trusted-preview.vercel.app".
// In production, an unset CLIENT_ORIGIN fails closed (empty allowlist —
// see validateEnv(), which already requires this var) rather than
// falling back to a localhost origin that could never legitimately be
// the caller. In development, localhost is added for convenience.
const configuredOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const devOrigins = isProduction ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const allowedOrigins = [...new Set([...configuredOrigins, ...devOrigins])];

// A real Origin header is always scheme://host[:port] — no path, no
// query, no trailing content. This also rejects the literal string
// "null" (sent by sandboxed iframes, file:// pages, and some redirected
// requests) since `new URL('null')` throws, and rejects non-http(s)
// schemes like file:// or data:.
const isWellFormedOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === origin;
  } catch {
    return false;
  }
};

const corsOrigin = (origin, callback) => {
  // No Origin header at all is a server-to-server call, curl, or a health
  // probe — never a browser cross-origin request, so it's not something
  // CORS is meant to gate.
  if (!origin) {return callback(null, true);}

  if (!isWellFormedOrigin(origin)) {
    return callback(new Error('Origin is not allowed by the NexORA CORS policy'));
  }

  // Strict allowlist match only — deliberately NOT `origin.endsWith('.vercel.app')`
  // or `.onrender.com`. Both are public shared-hosting domains: anyone can
  // deploy a site there, and a suffix match would let that site make
  // credentialed requests against this API using a real user's cookies.
  if (allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
    return callback(null, true);
  }

  return callback(new Error('Origin is not allowed by the NexORA CORS policy'));
};

// ── Security middleware ──────────────────────────────────────────────────
// Cross-Origin-Resource-Policy defaults to 'same-origin' in Helmet, which
// applies as an *additional* browser-side check independent of CORS: even
// with correct Access-Control-Allow-Origin headers, a fetch() from the
// Vercel frontend to this Render API would be blocked from reading the
// response body. Since CORS (above) is the actual access-control boundary
// — a strict allowlist, not merely "these headers are present" — widening
// CORP to 'cross-origin' here doesn't weaken authorization; it just stops
// an unrelated browser check from also blocking a request CORS already
// approved.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: corsOrigin,
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
    docs: `${req.protocol}://${req.get('host')}/api/health`,
  });
});

// ── 404 catch-all ────────────────────────────────────────────────────────
app.use(notFound);

// ── Global error handler (must be last) ─────────────────────────────────
app.use(errorHandler);

module.exports = app;
