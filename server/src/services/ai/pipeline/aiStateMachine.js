class AIStateMachine {
  constructor() {
    this.STATES = {
      GREETING: 'GREETING',
      DISCOVERY: 'DISCOVERY',
      CLARIFICATION: 'CLARIFICATION',
      RECOMMENDATION: 'RECOMMENDATION',
      COMPARISON: 'COMPARISON',
      DECISION: 'DECISION',
      CHECKOUT_ASSISTANCE: 'CHECKOUT_ASSISTANCE',
      AFTERCARE: 'AFTERCARE'
    };

    // Valid transitions
    this.TRANSITIONS = {
      [this.STATES.GREETING]: [this.STATES.DISCOVERY, this.STATES.CLARIFICATION],
      [this.STATES.DISCOVERY]: [this.STATES.CLARIFICATION, this.STATES.RECOMMENDATION],
      [this.STATES.CLARIFICATION]: [this.STATES.RECOMMENDATION, this.STATES.DISCOVERY],
      [this.STATES.RECOMMENDATION]: [this.STATES.COMPARISON, this.STATES.DECISION, this.STATES.CLARIFICATION],
      [this.STATES.COMPARISON]: [this.STATES.DECISION, this.STATES.RECOMMENDATION],
      [this.STATES.DECISION]: [this.STATES.CHECKOUT_ASSISTANCE],
      [this.STATES.CHECKOUT_ASSISTANCE]: [this.STATES.AFTERCARE, this.STATES.DECISION],
      [this.STATES.AFTERCARE]: [this.STATES.DISCOVERY]
    };
  }

  /**
   * Evaluates the current state and incoming intent/events to determine the next state.
   */
  transition(currentState, intent, events = []) {
    let nextState = currentState || this.STATES.GREETING;

    // Fast-path overrides based on explicit commerce events
    if (events.includes('START_CHECKOUT')) return this.STATES.CHECKOUT_ASSISTANCE;
    if (events.includes('COMPARE_PRODUCTS')) return this.STATES.COMPARISON;
    if (events.includes('ORDER_COMPLETED')) return this.STATES.AFTERCARE;

    // Intent-based transitions
    switch (intent) {
      case 'gift-finder':
      case 'luxury-advisor':
        if (currentState === this.STATES.GREETING || !currentState) nextState = this.STATES.DISCOVERY;
        break;
      case 'comparison':
        nextState = this.STATES.COMPARISON;
        break;
      case 'checkout-assistance':
        nextState = this.STATES.CHECKOUT_ASSISTANCE;
        break;
      case 'order-status':
        nextState = this.STATES.AFTERCARE;
        break;
    }

    // Validate transition (if invalid, usually we stay in current state or fallback)
    // For V10.6 we allow jumping if forced by intent (e.g. user suddenly asks about checkout)
    return nextState;
  }
}

module.exports = new AIStateMachine();
