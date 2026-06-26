/**
 * NexORA v1.0.0 — Feature Flags
 *
 * Controls which capabilities are live in production.
 * All flags can be toggled without redeploying the server.
 *
 * v1.0.0 Launch State:
 *   ✅ AI Concierge (Gemini 2.5 Flash)
 *   ✅ Admin AI Studio (Gemini 2.5 Pro)
 *   ✅ COD checkout (only live payment method)
 *   ✅ PostHog analytics
 *   ✅ VIP AI features
 *   ⏳ Stripe  — disabled until full payment lifecycle is tested
 *   ⏳ PayPal  — disabled until full payment lifecycle is tested
 *   ⏳ Visual Search — disabled (Phase 2)
 *   ⏳ Style Profiles — disabled (Phase 2)
 *   ⏳ Budget Intelligence — disabled (Phase 2)
 */

const featureFlags = {
  // ── Core AI Engine ───────────────────────────────────────────────────────
  aiCommerce:          true,   // Master switch for AI Commerce Engine (Gemini 2.5 Flash)
  adminAIStudio:       true,   // Admin AI Studio tools (Gemini 2.5 Pro)

  // ── Payment Gateways ─────────────────────────────────────────────────────
  // COD is always live (no flag needed — it's the default).
  // Stripe/PayPal are DISABLED for v1.0.0 pending full payment lifecycle testing:
  //   payment intent → webhook → success → failure → refund → reconciliation
  enableStripe:        false,
  enablePayPal:        false,

  // ── Intelligence & Profiles (Phase 2) ────────────────────────────────────
  visualSearch:        false,  // Image upload + vector search
  styleProfiles:       false,  // Deterministic style weight tracking
  budgetIntelligence:  false,  // Dynamic budget limits based on browsing history
  occasionEngine:      true,   // Abstract occasion → product filter mapping

  // ── Premium Capabilities (Phase 3) ───────────────────────────────────────
  vipDashboard:        true,   // VIP user-specific features
  aiPriceAdvisor:      false,  // Proactive price/discount recommendations
  outfitBuilder:       false,  // Cross-selling outfit suggestions

  // ── Infrastructure ────────────────────────────────────────────────────────
  cachingEnabled:      true,   // AI response caching
  experimentsEnabled:  false,  // AI A/B testing
  enablePostHog:       true,   // PostHog product analytics
};

module.exports = featureFlags;
