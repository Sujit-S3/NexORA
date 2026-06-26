# NexORA v1.0.0 — Launch Checklist

Use this document before every production deployment. Every item must be checked.
Do NOT deploy unless all items pass.

---

## Phase A — Release Candidate (RC1) ✅ COMPLETE

### Code Quality
- [x] All critical bugs resolved (see CHANGELOG.md for bug list)
- [x] Production build passes: `npm run build` — 0 errors, 0 warnings
- [x] Feature development frozen

### Security
- [x] Helmet security headers enabled
- [x] MongoSanitize NoSQL injection protection enabled  
- [x] Rate limiting: API (100/15min), Auth (10/15min), AI (40/15min)
- [x] JWT with HttpOnly cookies (SameSite=strict, secure=true in prod)
- [x] Single-use password reset tokens (SHA-256 hashed, 15-min TTL)
- [x] CORS properly configured with origin whitelist
- [x] `x-session-id` header added to CORS allowedHeaders
- [x] Input validation on all auth endpoints

### AI Validation
- [x] `/api/ai/health` returns `available: true` and `model` field
- [x] AI Concierge input enabled (not "assisting other clients")
- [x] AI uses only MongoDB products (no hallucinations)
- [x] Intent detection working (Gemini JSON mode)
- [x] SSE streaming functional
- [x] Response guard active
- [x] Policy engine active (inventory/budget/context filtering)

### Commerce Validation
- [x] Product search working (69 products, full-text search)
- [x] Product filtering by category/brand/price
- [x] Add to cart functional
- [x] Wishlist functional
- [x] Checkout flow complete
- [x] Order creation and inventory deduction working
- [x] Admin dashboard accessible

### Analytics
- [x] PostHog installed and initialized in `main.jsx`
- [x] User identification on login/register
- [x] User identity reset on logout
- [x] AI Conversation Started tracked
- [x] analyticsService.js created with all required events

### Database
- [x] `backup_db.js` created and tested
- [x] MongoDB Atlas automated backups verified
- [x] Manual backup executed before deployment

### Environment
- [x] `server/.env.example` updated with all required variables
- [x] `client/.env.example` updated with all required variables
- [x] All required env vars documented

### Documentation
- [x] CHANGELOG.md generated
- [x] rollback_plan.md generated
- [x] launch_checklist.md (this file) generated

---

## Phase B — Staging Deployment

Before promoting to production, deploy to staging and complete ALL checks below.

### Deployment Steps
- [ ] Push code to GitHub: `git push origin main`
- [ ] Wait for Render auto-deploy (backend)
- [ ] Wait for Vercel auto-deploy (frontend)
- [ ] Set all production environment variables in Render and Vercel

### Staging Smoke Tests
- [ ] `GET /api/health` returns `{ success: true }`
- [ ] `GET /api/ai/health` returns `{ available: true }`
- [ ] `GET /api/products` returns 69 products
- [ ] Login with test account succeeds
- [ ] AI Concierge responds to "Show me luxury watches"
- [ ] Add to Cart works
- [ ] Checkout completes
- [ ] Admin dashboard loads
- [ ] PostHog events appear in PostHog dashboard

### Performance (Lighthouse on Staging)
- [ ] Performance ≥ 85
- [ ] Accessibility ≥ 90
- [ ] Best Practices ≥ 90
- [ ] SEO ≥ 90

### Browser Console (Staging)
- [ ] Homepage: 0 uncaught errors
- [ ] Products: 0 uncaught errors
- [ ] Concierge: 0 uncaught errors
- [ ] Checkout: 0 uncaught errors
- [ ] Admin: 0 uncaught errors

---

## Phase C — Production Release

Only proceed after Phase B passes completely.

### Final Actions
- [ ] Execute production database backup: `node server/backup_db.js`
- [ ] Verify backup file created and valid
- [ ] Promote staging to production (Vercel + Render)
- [ ] Run production smoke tests (same as Phase B)
- [ ] Create Git tag:
  ```bash
  git tag v1.0.0
  git push origin v1.0.0
  ```
- [ ] Publish GitHub Release with CHANGELOG content
- [ ] Announce launch

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead Engineer | | | |
| QA Lead | | | |
| Product Owner | | | |

---

_No exceptions. No skipped steps. No assumptions._
