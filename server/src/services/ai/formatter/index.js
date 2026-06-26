const crypto = require('crypto');

class ResponseFormatter {
  constructor() {
    this.version = 'V10.5.1';
    this.pipeline = 'commerce-engine';
  }

  /**
   * Generates a unique Recommendation ID for tracking.
   */
  generateRecId() {
    return 'REC_' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  /**
   * Serializes the initial deterministic products payload with metadata.
   */
  serializeProducts(products, intent, startTime) {
    const latency = Date.now() - startTime;
    return JSON.stringify({
      version: this.version,
      pipeline: this.pipeline,
      intent: intent,
      recId: this.generateRecId(),
      latency: latency,
      products: products
    });
  }

  /**
   * Serializes a chunk of text from the AI stream.
   */
  serializeStreamChunk(text) {
    return JSON.stringify({ text: text });
  }

  /**
   * Serializes errors or guard interventions.
   */
  serializeError(message) {
    return JSON.stringify({ error: true, text: message });
  }
}

module.exports = new ResponseFormatter();
