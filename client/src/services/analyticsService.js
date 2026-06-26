// NexORA — Analytics Service (PostHog + Internal)
// Centralized tracking for all commerce and AI events.
// PostHog for product analytics, internal API for commerce metrics.

import posthog from 'posthog-js';

const isPostHogEnabled = () =>
  typeof posthog !== 'undefined' && posthog.__loaded;

/**
 * All tracked events for NexORA.
 * These match the product analytics requirements from the RC1 plan.
 */
export const ANALYTICS_EVENTS = {
  // Session
  SESSION_START: 'session_started',
  // Discovery
  SEARCH: 'product_searched',
  PRODUCT_VIEW: 'product_viewed',
  CATEGORY_VIEW: 'category_viewed',
  COMPARE: 'products_compared',
  // Commerce
  WISHLIST_ADD: 'wishlist_item_added',
  WISHLIST_REMOVE: 'wishlist_item_removed',
  CART_ADD: 'cart_item_added',
  CART_REMOVE: 'cart_item_removed',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_COMPLETED: 'checkout_completed',
  COUPON_APPLIED: 'coupon_applied',
  PURCHASE: 'purchase_completed',
  // AI
  AI_CONVERSATION_STARTED: 'ai_conversation_started',
  AI_MESSAGE_SENT: 'ai_message_sent',
  AI_RECOMMENDATION_CLICK: 'ai_recommendation_clicked',
  AI_COMPARE_USED: 'ai_compare_used',
  AI_GIFT_FINDER: 'ai_gift_finder_used',
};

/**
 * Core analytics capture function.
 * Sends to PostHog. Internal Commerce events are tracked separately via the API.
 */
const capture = (event, properties = {}) => {
  try {
    if (isPostHogEnabled()) {
      posthog.capture(event, {
        ...properties,
        app_version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    // Analytics must never crash the application
    if (import.meta.env.DEV) {
      console.warn('[Analytics] Capture failed:', event, err);
    }
  }
};

/**
 * Identify a user in PostHog after login.
 */
export const identifyUser = (user) => {
  try {
    if (isPostHogEnabled() && user?._id) {
      posthog.identify(user._id, {
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Analytics] Identify failed:', err);
  }
};

/**
 * Reset PostHog identity on logout.
 */
export const resetUser = () => {
  try {
    if (isPostHogEnabled()) posthog.reset();
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Analytics] Reset failed:', err);
  }
};

// ── Convenience Tracking Functions ─────────────────────────────────────────

export const trackSearch = (query, resultCount = 0) =>
  capture(ANALYTICS_EVENTS.SEARCH, { query, result_count: resultCount });

export const trackProductView = (product) =>
  capture(ANALYTICS_EVENTS.PRODUCT_VIEW, {
    product_id: product?._id,
    product_name: product?.name,
    brand: product?.brand,
    category: product?.category?.name,
    price: product?.discountPrice || product?.price,
  });

export const trackCompare = (productIds) =>
  capture(ANALYTICS_EVENTS.COMPARE, { product_ids: productIds, count: productIds.length });

export const trackWishlistAdd = (product) =>
  capture(ANALYTICS_EVENTS.WISHLIST_ADD, {
    product_id: product?._id,
    product_name: product?.name,
    brand: product?.brand,
  });

export const trackWishlistRemove = (productId) =>
  capture(ANALYTICS_EVENTS.WISHLIST_REMOVE, { product_id: productId });

export const trackCartAdd = (product, quantity = 1) =>
  capture(ANALYTICS_EVENTS.CART_ADD, {
    product_id: product?._id,
    product_name: product?.name,
    brand: product?.brand,
    price: product?.discountPrice || product?.price,
    quantity,
    revenue: (product?.discountPrice || product?.price) * quantity,
  });

export const trackCartRemove = (productId) =>
  capture(ANALYTICS_EVENTS.CART_REMOVE, { product_id: productId });

export const trackCheckoutStarted = (cartItems = [], totalPrice = 0) =>
  capture(ANALYTICS_EVENTS.CHECKOUT_STARTED, {
    item_count: cartItems.length,
    total_value: totalPrice,
  });

export const trackPurchase = (order) =>
  capture(ANALYTICS_EVENTS.PURCHASE, {
    order_id: order?._id,
    total: order?.totalPrice,
    items: order?.items?.length,
    currency: 'INR',
  });

export const trackAIConversationStarted = () =>
  capture(ANALYTICS_EVENTS.AI_CONVERSATION_STARTED);

export const trackAIMessageSent = (intent = 'unknown') =>
  capture(ANALYTICS_EVENTS.AI_MESSAGE_SENT, { intent });

export const trackAIRecommendationClick = (product, recId) =>
  capture(ANALYTICS_EVENTS.AI_RECOMMENDATION_CLICK, {
    product_id: product?._id,
    product_name: product?.name,
    rec_id: recId,
  });

export const trackAIGiftFinder = (wizard) =>
  capture(ANALYTICS_EVENTS.AI_GIFT_FINDER, {
    recipient: wizard?.recipient,
    budget: wizard?.budget,
    category: wizard?.category,
  });

export default { capture, identifyUser, resetUser, ANALYTICS_EVENTS };
