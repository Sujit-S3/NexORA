# CHANGELOG

All notable changes to NexORA are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed — Payment Verification Security Hole

The v1.0.0 "Razorpay payment integration scaffold" was actually a client-side
simulation: the browser computed `Math.random()` and told the server whether
to mark the order paid, with no gateway involved. This has been replaced with
a real Razorpay integration:

- Real Razorpay order creation (`initiatePayment`) and HMAC-SHA256 signature
  verification of the checkout callback (`verifyPayment`) — no payment status
  is ever trusted from the client.
- `POST /api/payments/webhook` — signature-verified server-to-server
  reconciliation for `payment.captured`/`payment.failed` events (the
  "Razorpay webhook verification" previously listed under Planned for v1.1.0).
- Idempotent, transaction-guarded payment/order updates — a replayed or
  concurrent verify request can no longer double-process a payment.
- Removed the fake `stripe`/`paypal` checkout options that didn't correspond
  to any real integration.
- First automated test suite in the repo (Jest + Supertest +
  mongodb-memory-server): signature verification unit tests and
  duplicate/replay-prevention integration tests for `POST /api/payments/verify`.
- Online payments now fail closed: if `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET`
  are not configured, only Cash on Delivery is accepted at checkout.

### Added — Refresh Token Rotation

- `POST /api/auth/refresh` issues a new access + refresh token pair from the
  `nexora_refresh` httpOnly cookie and rotates the stored token record.
- Reuse detection: presenting an already-rotated (revoked) refresh token
  revokes the entire token family for that user and forces re-authentication
  — the standard mitigation for a stolen-refresh-token replay.
- Client silently retries a 401 once via the refresh endpoint before falling
  back to redirecting to login, so an expired access token no longer logs
  the user out mid-session.
- Login/register/logout/password-change/password-reset all issue, rotate, or
  revoke refresh tokens as appropriate.

### Added — Sentry Error Tracking

- Server: `@sentry/node` initialized at boot, capturing unhandled
  rejections/exceptions and 5xx API errors (4xx client errors are not sent).
- Client: `@sentry/react` wraps the app in an `ErrorBoundary` with a
  dedicated fallback UI; both are no-ops unless `SENTRY_DSN` /
  `VITE_SENTRY_DSN` are configured.
- Removed the placeholder Sentry `<script>` tag in `client/index.html` that
  pointed at a fake project ID and 404'd on every page load.

### Added — Contact Form Backend

- `POST /api/contact` — validated, rate-limited endpoint that emails the
  submission to `CONTACT_EMAIL` (via Resend) with the sender set as
  reply-to.
- `client/src/pages/Contact.jsx` now submits real form state instead of
  rendering a non-functional form.

### Added — Coupon Carryover (Cart → Checkout)

- A discount code applied on the Cart page is now carried into Checkout via
  `sessionStorage` and auto-validated/applied there, instead of requiring
  the shopper to re-enter it.

### Fixed — Security Hardening

- Closed an IDOR allowing a guest to cancel another guest's order by
  guessing its ID.
- `dangerouslySetInnerHTML` output is now sanitized with DOMPurify.
- Auth now relies solely on httpOnly cookies (JWT is no longer also
  readable from `localStorage`/response body).
- Several admin-page and coupon-application auth/authorization gaps closed.

### Fixed — Admin Dashboard & Data Integrity

- Category Management and Analytics pages were reading the wrong
  `localStorage` key and silently rendering empty/broken state — fixed.
- Added missing database indexes and pagination to admin list endpoints
  that were doing full unpaginated collection scans.
- Fixed the promotional fit banner, coupon auth check, guest cart URL
  handling, and admin order-status transitions.

### Changed — Performance

- AI Concierge no longer re-renders the entire message list on every
  streamed token.
- Product images now request Cloudinary's responsive transforms
  (`w_`, `q_auto`, `f_auto`) instead of full-resolution originals.
- Product list API responses trimmed to only the fields the UI uses.
- Batched several N+1 query patterns in admin/order endpoints.

### Changed — Accessibility

- Focus management, ARIA labels/roles, dialog semantics, and `aria-live`
  regions added across the client for screen-reader and keyboard-only use.

### Added — Test Coverage

- First Vitest + React Testing Library suite on the client.
- Expanded server Jest coverage: auth (including refresh-token rotation
  and reuse detection), orders, and cart.

### Added — CI/CD & Deployment

- GitHub Actions CI pipeline (lint + test on push/PR for both client and
  server).
- Fixed a conflicting deployment manifest and added a documented
  environment-variable/health-check contract for the Render deploy.

### Removed — Debug/Development Scripts

- Deleted 47 one-off scratch scripts (ad-hoc DB inspection/migration
  scripts, pre-Vitest manual test harnesses, local asset-processing
  helpers) that were never referenced by any npm script, CI step, or ops
  document. `server/backup_db.js` — the one script that *is* a documented,
  actively-used ops tool (see `rollback_plan.md`) — was kept.

---

## [1.0.0] — 2026-06-26 — Release Candidate 1 (RC1)

### Added

#### AI Commerce Engine (V10.5.1)
- Full SSE streaming AI Concierge powered by Google Gemini 2.5 Flash
- 9-stage AI pipeline: Intent → Resolve → Policy → Context → Rank → Prompt → Model → Guard → Stream
- Intent Detector (deterministic + Gemini-based)
- MongoDB-only product resolution (zero AI hallucination)
- Policy Engine: Inventory, Budget, Security, Context-Limit policies
- Ranking Service: Deterministic scoring by category/brand/budget/rating
- Response Guard: Anti-hallucination, auto-repair, banned word filtering
- Response Scoring: Confidence, grounding, recommendation quality, token usage
- Recommendation Memory: Anti-fatigue session filter
- AI State Machine: Conversation state tracking (GREETING→DECISION→AFTERCARE)
- Model Router: Provider-agnostic (Gemini Flash/Pro, stubs for OpenAI/Claude)
- Feature Flags: Runtime AI module toggles
- AI Versioning: Every response includes metadata (version, pipeline, model, latency)
- Gift Finder Wizard: 4-step AI-powered gift curation
- Post-Purchase Care packages

#### Commerce Engine
- 69 luxury products across Watches, Bags, Jewellery, Electronics, Accessories
- Search, Filtering, Sorting
- Cart with guest-to-user merge on login
- Wishlist with guest-to-user merge on login
- Multi-step Checkout (address → shipping → payment → review)
- Full order lifecycle management
- Real-time inventory with variant-level stock management
- Coupon system (percentage + fixed, usage limits)
- Shipping zones with configurable rates
- Razorpay payment integration scaffold + COD

#### Admin Dashboard
- Real-time metrics dashboard
- Full CRUD for products (with Cloudinary image upload)
- Order management, Customer management, Category management
- AI Studio: SEO generator, review analyzer, sales analyst
- Analytics reports

#### Authentication & Security
- JWT (7d) + Refresh Token (30d) authentication
- HTTP-only secure cookies (SameSite=strict)
- Single-use password reset tokens (15-minute expiry, SHA-256 hashed)
- Email enumeration protection
- Multi-tier rate limiting (API/Auth/AI)
- Helmet, MongoSanitize, express-validator

#### Personalization Engine
- 15 commerce event types tracked
- Weighted brand affinity, budget intelligence, occasion engine
- Guest preference merge on authentication
- Homepage + pre-chat AI recommendations

#### Analytics
- PostHog integration (session, search, product view, cart, checkout, purchase, AI events)
- Internal commerce KPI tracker

---

### Bug Fixes (RC1 Pre-Flight Audit)

| # | Severity | Bug | Fix |
|---|----------|-----|-----|
| 1 | CRITICAL | `aiHealth.available` always `undefined` — AI Concierge permanently disabled | Added `available` + `model` fields to `/api/ai/health` |
| 2 | CRITICAL | `gift_finder` event used array push on `budgets` object — MongoServerError | Fixed to update `budgets.declared` (V10.6 schema) |
| 3 | HIGH | `mergeSessionPreferences` treated `budgets` object as array | Fixed to object-merge `declared` field |
| 4 | HIGH | `/payment-success` route missing from React Router — returns 404 | Added `PaymentSuccess` route to `App.jsx` |
| 5 | SECURITY | CORS missing `x-session-id` — AI session tracking blocked cross-origin | Added header to `allowedHeaders` |

---

### Infrastructure

- PostHog product analytics
- MongoDB Atlas database with backup script
- Cloudinary CDN image delivery
- Feature flags for runtime AI module control
- Catalog versioning for AI cache invalidation

---

## Planned for v1.1.0

- Visual Search (image-to-product)
- Redis AI cache (replace in-memory Map)
- PostHog funnel dashboards
- Razorpay refunds (`paymentService.processRefund` is still an explicit stub)

---

_NexORA v1.0.0 — Built with precision. Launched with confidence._
