const intentDetector = require('./intentDetector');
const productResolver = require('./productResolver');
const policyEngine = require('../guard/policyEngine');
const contextBuilder = require('../context/index');
const rankingService = require('../ranking/index');
const explanationService = require('../formatter/explanationService');
const responseFormatter = require('../formatter/index');
const promptBuilder = require('../prompts/promptBuilder');
const modelRouter = require('../router/index');
const responseGuard = require('../guard/responseGuard');
const crypto = require('crypto');

// ── Diagnostic Logger ────────────────────────────────────────────────────────
// Emits structured per-stage trace logs so every failure is immediately
// visible in the backend terminal during the V12.2 diagnostic sprint.
const log = {
  _pad: (n, digits = 4) => String(n).padStart(digits, '0'),
  stage: (requestId, stage, data) => {
    console.log(`\n[PIPELINE:${requestId}] ── STAGE ${stage} ──────────────────────────`);
    if (data) console.dir(data, { depth: 4, colors: true });
  },
  ok: (requestId, stage, label, ms) => {
    console.log(`[PIPELINE:${requestId}] ✅  ${stage} OK — ${label} (${ms}ms)`);
  },
  fail: (requestId, stage, error) => {
    console.error(`[PIPELINE:${requestId}] ❌  ${stage} FAILED`);
    console.error(`[PIPELINE:${requestId}]    Message: ${error.message}`);
    if (error.status) console.error(`[PIPELINE:${requestId}]    HTTP Status: ${error.status} ${error.statusText || ''}`);
    if (error.errorDetails) console.error(`[PIPELINE:${requestId}]    Details:`, JSON.stringify(error.errorDetails, null, 2));
    if (error.stack) console.error(`[PIPELINE:${requestId}]    Stack:\n${error.stack}`);
  },
  summary: (requestId, totalMs) => {
    console.log(`\n[PIPELINE:${requestId}] ── COMPLETE — Total latency: ${totalMs}ms ──\n`);
  }
};

// Helper to produce a human-readable error for the frontend that includes the
// request ID for tracing.
function buildDiagnosticError(requestId, stage, error) {
  const isQuota = error?.status === 429 || (error?.message || '').toLowerCase().includes('quota');
  if (isQuota) {
    return `Our AI concierge is momentarily at peak capacity, serving other clients. Please feel free to retry your request in a few moments. [Ref: ${requestId}]`;
  }
  return `I apologize, but I encountered a temporary issue while preparing your recommendations. Please try again. [Ref: ${requestId}]`;
}

class PipelineService {
  /**
   * Orchestrates the entire AI Commerce Intelligence Pipeline.
   * Customer Message → Intent → Resolve → Policy → Context → Rank → Prompt → AI → Guard → SSE
   *
   * Every stage is instrumented with timing and I/O diagnostics during V12.2 Sprint.
   */
  async processRequest(userMessage, user, reqHeaders, chatHistory = [], res) {
    const globalStart = Date.now();
    const requestId = crypto.randomBytes(3).toString('hex').toUpperCase();
    const sessionId = reqHeaders['x-session-id'] || 'anonymous';
    const conversationId = reqHeaders['x-conversation-id'] || 'none';

    console.log(`\n${'═'.repeat(64)}`);
    console.log(`[PIPELINE:${requestId}] NEW REQUEST`);
    console.log(`[PIPELINE:${requestId}]  Session   : ${sessionId}`);
    console.log(`[PIPELINE:${requestId}]  Conv ID   : ${conversationId}`);
    console.log(`[PIPELINE:${requestId}]  User      : ${user?._id || 'guest'}`);
    console.log(`[PIPELINE:${requestId}]  Message   : "${userMessage}"`);
    console.log(`${'─'.repeat(64)}`);

    try {
      // ── STAGE 1: Intent Detection ──────────────────────────────────────────
      log.stage(requestId, '1 — Intent Detection (local classifier)', { message: userMessage });
      const s1 = Date.now();
      const detectedIntent = intentDetector.detectIntent(userMessage);
      log.ok(requestId, 'Intent', `intent=${detectedIntent.intent}, needsDB=${detectedIntent.needsDB}, needsGemini=${detectedIntent.needsGemini}`, Date.now() - s1);
      log.stage(requestId, '1 — Intent Result', detectedIntent);

      let rankedProducts = [];
      let finalContext = {};

      if (detectedIntent.needsDB || detectedIntent.needsRules) {
        // ── STAGE 2: Context Builder ─────────────────────────────────────────
        log.stage(requestId, '2 — Context Builder', { userId: user?._id, intent: detectedIntent.intent });
        const s2 = Date.now();
        finalContext = await contextBuilder.buildContext(user, detectedIntent);
        log.ok(requestId, 'Context', `keys=${Object.keys(finalContext).join(', ')}`, Date.now() - s2);

        // ── STAGE 2.5: AI State Machine ──────────────────────────────────────
        const aiStateMachine = require('./aiStateMachine');
        const currentState = finalContext.preferences?.aiState || 'GREETING';
        const nextState = aiStateMachine.transition(currentState, detectedIntent.intent, []);
        finalContext.aiState = nextState;
        console.log(`[PIPELINE:${requestId}]  State: ${currentState} → ${nextState}`);

        // ── STAGE 3: Product Resolver ────────────────────────────────────────
        let rawProducts = [];
        let resolverMeta = { confidence: 0 };
        if (detectedIntent.needsDB) {
          log.stage(requestId, '3 — Product Resolver', { entities: detectedIntent.entities });
          const s3 = Date.now();
          const resolvedData = await productResolver.resolveProducts(detectedIntent.entities);
          rawProducts = resolvedData.products;
          resolverMeta.confidence = resolvedData.confidence;
          log.ok(requestId, 'Resolver', `products=${rawProducts.length}, confidence=${resolverMeta.confidence}`, Date.now() - s3);
        } else {
          console.log(`[PIPELINE:${requestId}] ⏭️  STAGE 3 — Skipped (needsDB=false)`);
        }

        // ── STAGE 3.5: Recommendation Memory ────────────────────────────────
        const recommendationMemory = require('../memory/recommendationMemory');
        const freshProducts = recommendationMemory.filterRepeatedRecommendations(rawProducts, sessionId);
        console.log(`[PIPELINE:${requestId}]  Anti-Fatigue: ${rawProducts.length} → ${freshProducts.length} products (filtered repeated)`);

        // ── STAGE 4: Policy Engine ───────────────────────────────────────────
        log.stage(requestId, '4 — Policy Engine', { productsIn: freshProducts.length });
        const s4 = Date.now();
        const safeProducts = policyEngine.enforceRules(freshProducts, finalContext.preferences || {});
        log.ok(requestId, 'Policy', `${freshProducts.length} → ${safeProducts.length} products after policy`, Date.now() - s4);

        // ── STAGE 5: Ranking Engine ──────────────────────────────────────────
        log.stage(requestId, '5 — Ranking Engine', { productsIn: safeProducts.length });
        const s5 = Date.now();
        rankedProducts = rankingService.rankProducts(safeProducts, finalContext.preferences || {});
        log.ok(requestId, 'Ranking', `${safeProducts.length} → ${rankedProducts.length} products ranked`, Date.now() - s5);
      } else {
        console.log(`[PIPELINE:${requestId}] ⏭️  STAGES 2-5 — Skipped (needsDB=false, needsRules=false)`);
      }

      if (!detectedIntent.needsGemini) {
        console.log(`[PIPELINE:${requestId}] ⏭️  STAGES 6-8 — Skipped (needsGemini=false), returning products`);
        const explanations = explanationService.formatExplanations(rankedProducts);
        res.write(`data: ${responseFormatter.serializeProducts(explanations, detectedIntent.intent, globalStart)}\n\n`);
        // If products were found, send a soft message explaining no AI text is available
        if (rankedProducts.length > 0) {
          res.write(`data: ${responseFormatter.serializeStreamChunk("I've curated the best matches from our catalog for you. Our AI advisor is at peak capacity right now — please feel free to ask again in a moment for personalised commentary.")}\n\n`);
        } else {
          res.write(`data: ${responseFormatter.serializeStreamChunk("Our AI advisor is momentarily at peak capacity. Please try again in a moment.")}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        log.summary(requestId, Date.now() - globalStart);
        return res.end();
      }

      // ── STAGE 6: Prompt Builder ────────────────────────────────────────────
      log.stage(requestId, '6 — Prompt Builder', { rankedProducts: rankedProducts.length, historyLength: chatHistory.length });
      const s6 = Date.now();
      const summarizer = require('../memory/summarizer');
      const sessionTimeline = require('../memory/sessionTimeline');
      const compressedHistory = summarizer.compress(chatHistory);
      const timelineStr = sessionTimeline.formatTimelineForPrompt(sessionId);
      const prompt = promptBuilder.buildPrompt(finalContext, rankedProducts, userMessage, compressedHistory, timelineStr);
      log.ok(requestId, 'Prompt', `chars=${prompt.length}`, Date.now() - s6);

      // ── STAGE 7: Model Router (Gemini) ─────────────────────────────────────
      log.stage(requestId, '7 — Model Router (Gemini)', { intent: detectedIntent.intent });
      const s7 = Date.now();
      let stream;
      try {
        stream = await modelRouter.streamResponse(detectedIntent.intent, prompt);
      } catch (routerError) {
        log.fail(requestId, 'STAGE 7 — Model Router', routerError);
        const diagMsg = buildDiagnosticError(requestId, 'Model Router (Gemini)', routerError);
        res.write(`data: ${responseFormatter.serializeStreamChunk(diagMsg)}\n\n`);
        res.write(`data: [DONE]\n\n`);
        return res.end();
      }
      log.ok(requestId, 'Model Router', `stream acquired`, Date.now() - s7);

      let fullResponse = '';

      // Send deterministic products immediately (before streaming text)
      if (rankedProducts.length > 0) {
        const explanations = explanationService.formatExplanations(rankedProducts);
        res.write(`data: ${responseFormatter.serializeProducts(explanations, detectedIntent.intent, globalStart)}\n\n`);
        console.log(`[PIPELINE:${requestId}]  Products payload sent (${rankedProducts.length} products)`);
      }

      // Stream text chunks to client
      const s7stream = Date.now();
      let chunkCount = 0;
      for await (const chunkText of stream) {
        fullResponse += chunkText;
        chunkCount++;
        res.write(`data: ${responseFormatter.serializeStreamChunk(chunkText)}\n\n`);
      }
      log.ok(requestId, 'Streaming', `${chunkCount} chunks, ${fullResponse.length} chars`, Date.now() - s7stream);

      // ── STAGE 8: Response Guard ────────────────────────────────────────────
      log.stage(requestId, '8 — Response Guard', { responseLength: fullResponse.length, products: rankedProducts.length });
      const s8 = Date.now();
      const guardResult = responseGuard.validateResponse(fullResponse, rankedProducts);
      log.ok(requestId, 'Guard', `isValid=${guardResult.isValid}`, Date.now() - s8);

      if (!guardResult.isValid) {
        console.warn(`[PIPELINE:${requestId}] ⚠️  Guard rejected response, sending safe fallback`);
        res.write(`data: ${responseFormatter.serializeError(guardResult.safeResponse)}\n\n`);
      }

      // Metadata & scoring
      const responseScoring = require('../guard/responseScoring');
      const scores = responseScoring.calculateScore(fullResponse, rankedProducts, finalContext);
      const metadataPayload = JSON.stringify({ type: 'METADATA', scores });
      res.write(`data: ${metadataPayload}\n\n`);

      res.write('data: [DONE]\n\n');
      res.end();

      log.summary(requestId, Date.now() - globalStart);

    } catch (error) {
      log.fail(requestId, 'OUTER CATCH (unhandled pipeline exception)', error);
      const diagMsg = buildDiagnosticError(requestId, 'Pipeline (unhandled)', error);
      // Stream the diagnostic message to the frontend instead of a generic apology
      res.write(`data: ${responseFormatter.serializeStreamChunk(diagMsg)}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
}

module.exports = new PipelineService();
