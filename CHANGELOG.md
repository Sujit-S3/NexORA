# CHANGELOG

All notable changes to NexORA are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- SendGrid transactional emails
- Visual Search (image-to-product)
- Redis AI cache (replace in-memory Map)
- PostHog funnel dashboards
- Razorpay webhook verification

---

_NexORA v1.0.0 — Built with precision. Launched with confidence._
