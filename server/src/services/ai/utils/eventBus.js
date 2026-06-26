const EventEmitter = require('events');

class EventBus extends EventEmitter {
  /**
   * Emits an event with mandatory correlation IDs for observability.
   */
  emitEvent(eventName, payload, reqContext = {}) {
    const fullPayload = {
      ...payload,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: reqContext.requestId || 'UNKNOWN',
        sessionId: reqContext.sessionId || 'UNKNOWN',
        customerId: reqContext.customerId || 'ANONYMOUS'
      }
    };
    this.emit(eventName, fullPayload);
  }
}

const eventBus = new EventBus();

// Core Commerce & AI Events
const EVENTS = {
  SESSION_STARTED: 'SESSION_STARTED',
  PAGE_VIEW: 'PAGE_VIEW',
  SEARCH: 'SEARCH',
  FILTER: 'FILTER',
  VIEW_PRODUCT: 'VIEW_PRODUCT',
  COMPARE_PRODUCTS: 'COMPARE_PRODUCTS',
  OPEN_AI: 'OPEN_AI',
  SEND_MESSAGE: 'SEND_MESSAGE',
  VIEW_RECOMMENDATION: 'VIEW_RECOMMENDATION',
  CLICK_RECOMMENDATION: 'CLICK_RECOMMENDATION',
  ADD_TO_WISHLIST: 'ADD_TO_WISHLIST',
  REMOVE_FROM_WISHLIST: 'REMOVE_FROM_WISHLIST',
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  START_CHECKOUT: 'START_CHECKOUT',
  APPLY_DISCOUNT: 'APPLY_DISCOUNT',
  ORDER_CREATED: 'ORDER_CREATED',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ORDER_COMPLETED: 'ORDER_COMPLETED',
  RETURN_PRODUCT: 'RETURN_PRODUCT',
  CONCIERGE_CHAT: 'CONCIERGE_CHAT'
};

module.exports = {
  eventBus,
  EVENTS
};
