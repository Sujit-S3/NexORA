const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiProvider {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.flashModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { temperature: 0.4 } });
    this.proModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro', generationConfig: { temperature: 0.6 } });
  }

  async stream(prompt, usePro) {
    const model = usePro ? this.proModel : this.flashModel;
    const result = await model.generateContentStream(prompt);
    
    // Abstract the Gemini stream to a standard async iterator interface
    async function* standardStream() {
      for await (const chunk of result.stream) {
        yield chunk.text();
      }
    }
    return standardStream();
  }
}

class OpenAIProvider {
  async stream(prompt, usePro) {
    throw new Error('OpenAI Provider not yet implemented');
  }
}

class ClaudeProvider {
  async stream(prompt, usePro) {
    throw new Error('Claude Provider not yet implemented');
  }
}

class ModelRouterService {
  constructor() {
    this.providers = {
      'gemini': new GeminiProvider(),
      'openai': new OpenAIProvider(),
      'claude': new ClaudeProvider()
    };
    this.defaultProvider = 'gemini';
  }

  /**
   * Routes the assembled prompt to the appropriate model based on intent.
   * Returns a standard string-emitting streaming async iterator.
   */
  async streamResponse(intent, prompt, providerName = this.defaultProvider) {
    const usePro = ['luxury-report', 'vip-styling-guide', 'inventory-forecast'].includes(intent);
    const provider = this.providers[providerName];

    if (!provider) throw new Error(`Provider ${providerName} not supported`);

    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await provider.stream(prompt, usePro);
      } catch (error) {
        const isQuota = error?.status === 429 || (error?.message || '').includes('quota') || (error?.message || '').includes('RESOURCE_EXHAUSTED');
        
        if (isQuota && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(`[ModelRouter] 429 Quota Exceeded. Retrying attempt ${attempt}/${maxRetries} in ${delay}ms...`);
          await new Promise(res => setTimeout(res, delay));
          continue; // Retry
        }

        // If it's not a quota error or we've exhausted retries, throw
        console.error(`Model Router Error [${providerName}] (Attempt ${attempt}):`, error.message);
        throw error;
      }
    }
  }
}

module.exports = new ModelRouterService();
