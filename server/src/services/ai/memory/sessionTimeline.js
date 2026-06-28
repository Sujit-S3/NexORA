const { eventBus, EVENTS } = require('../utils/eventBus');

class SessionTimeline {
  constructor() {
    // In-memory timeline storage per session: sessionId -> Array of timeline events
    this.timelines = new Map();
    this.subscribeToEvents();
  }

  getTimeline(sessionId) {
    if (!this.timelines.has(sessionId)) {
      this.timelines.set(sessionId, []);
    }
    return this.timelines.get(sessionId);
  }

  addEvent(sessionId, action, details) {
    const timeline = this.getTimeline(sessionId);
    
    // Keep only the last 20 actions to prevent token overflow
    if (timeline.length >= 20) {timeline.shift();}
    
    timeline.push({
      time: new Date().toISOString(),
      action,
      details,
    });
  }

  subscribeToEvents() {
    eventBus.on(EVENTS.VIEW_PRODUCT, (payload) => {
      this.addEvent(payload.sessionId, 'Viewed Product', payload.product?.name || payload.productId);
    });

    eventBus.on(EVENTS.COMPARE_PRODUCTS, (payload) => {
      this.addEvent(payload.sessionId, 'Compared Products', payload.productIds?.join(', '));
    });

    eventBus.on(EVENTS.ADD_TO_CART, (payload) => {
      this.addEvent(payload.sessionId, 'Added to Cart', payload.product?.name || payload.productId);
    });

    eventBus.on(EVENTS.OPEN_AI, (payload) => {
      this.addEvent(payload.sessionId, 'Opened AI Assistant', null);
    });
    
    eventBus.on(EVENTS.START_CHECKOUT, (payload) => {
      this.addEvent(payload.sessionId, 'Started Checkout', null);
    });
  }

  /**
   * Formats the timeline for the AI Prompt
   */
  formatTimelineForPrompt(sessionId) {
    const timeline = this.getTimeline(sessionId);
    if (!timeline || timeline.length === 0) {return 'No prior session events.';}

    return timeline.map(t => {
      const time = new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${time} - ${t.action}${t.details ? `: ${t.details}` : ''}`;
    }).join('\n');
  }
}

module.exports = new SessionTimeline();
