class ConversationSummarizer {
  constructor() {
    this.COMPRESSION_THRESHOLD = 10; // compress after 10 messages
  }

  /**
   * Evaluates if the chat history needs compression
   * @param {Array} chatHistory 
   */
  needsCompression(chatHistory) {
    return chatHistory && chatHistory.length >= this.COMPRESSION_THRESHOLD;
  }

  /**
   * Compresses chat history by removing early turns but keeping recent context.
   * In a real implementation, you might call a lightweight AI model to summarize 
   * the oldest 8 messages into a single "Summary" message.
   * 
   * @param {Array} chatHistory 
   */
  compress(chatHistory) {
    if (!this.needsCompression(chatHistory)) {return chatHistory;}

    // A simple heuristic: Keep the first message (original intent)
    // Keep the last 4 messages (immediate context)
    // Discard the middle. 
    // For V10.5.1 Phase 1.5, we do a basic trim.
    const firstMsg = chatHistory[0];
    const recentMsgs = chatHistory.slice(chatHistory.length - 4);
    
    return [
      firstMsg,
      { role: 'system', content: '[...Conversation Summarized for brevity...]' },
      ...recentMsgs,
    ];
  }
}

module.exports = new ConversationSummarizer();
