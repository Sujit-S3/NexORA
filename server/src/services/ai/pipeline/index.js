// NexORA V13 — AI Commerce Pipeline
// Architecture: Memory → Intent → Resolve → Policy → Context → Rank → Prompt → AI → Guard → SSE
const intentDetector      = require('./intentDetector');
const productResolver     = require('./productResolver');
const policyEngine        = require('../guard/policyEngine');
const contextBuilder      = require('../context/index');
const rankingService      = require('../ranking/index');
const explanationService  = require('../formatter/explanationService');
const responseFormatter   = require('../formatter/index');
const promptBuilder       = require('../prompts/promptBuilder');
const modelRouter         = require('../router/index');
const responseGuard       = require('../guard/responseGuard');
const crypto              = require('crypto');

// ── Diagnostic Logger ─────────────────────────────────────────────────────────
const log = {
  stage: (id, stage, data) => {
    console.log(`\n[PIPELINE:${id}] ── STAGE ${stage} ──────────────────────────`);
    if (data) {console.dir(data, { depth: 3, colors: true });}
  },
  ok:   (id, stage, label, ms) => console.log(`[PIPELINE:${id}] ✅  ${stage} OK — ${label} (${ms}ms)`),
  fail: (id, stage, error) => {
    console.error(`[PIPELINE:${id}] ❌  ${stage} FAILED`);
    console.error(`[PIPELINE:${id}]    Message: ${error.message}`);
    if (error.stack) {console.error(`[PIPELINE:${id}]    Stack:\n${error.stack}`);}
  },
  summary: (id, ms) => console.log(`\n[PIPELINE:${id}] ── COMPLETE — ${ms}ms ──\n`),
};

function buildDiagnosticError(requestId, stage, error) {
  const isQuota = error?.status === 429 || (error?.message || '').toLowerCase().includes('quota');
  if (isQuota) {
    return `Our AI concierge is momentarily at peak capacity. I've prepared today's curated recommendations while we reconnect. [Ref: ${requestId}]`;
  }
  return `Our concierge is temporarily unavailable. Here are curated recommendations prepared for you. [Ref: ${requestId}]`;
}

// ── Action Extractor ─────────────────────────────────────────────────────────
// Detect if Gemini's response contains a request to perform a commerce action
function extractActionsFromResponse(text, rankedProducts) {
  const actions = [];
  const lower = text.toLowerCase();

  // "Add [product] to cart" / "I've added it to your cart"
  if (/add.{0,30}to.{0,10}cart|i(?:'ve| have) added/i.test(text)) {
    if (rankedProducts.length > 0) {
      actions.push({ type: 'action', action: 'ADD_TO_CART', productId: rankedProducts[0]._id, productName: rankedProducts[0].name });
    }
  }
  // "Navigate to checkout" / "proceed to checkout"
  if (/proceed.{0,15}checkout|navigate.{0,15}checkout|head.{0,10}checkout/i.test(lower)) {
    actions.push({ type: 'action', action: 'NAVIGATE', to: '/checkout' });
  }
  // "Let's go to your cart"
  if (/go to.{0,10}cart|view.{0,10}cart/i.test(lower)) {
    actions.push({ type: 'action', action: 'NAVIGATE', to: '/cart' });
  }

  return actions;
}

class PipelineService {
  /**
   * Orchestrates the V13 AI Commerce Pipeline.
   * Emits luxury streaming status frames → products → text → actions
   *
   * @param {string}  userMessage  — raw customer input
   * @param {Object}  user         — authenticated user (may be null)
   * @param {Object}  reqHeaders   — request headers
   * @param {Array}   chatHistory  — prior turns
   * @param {Object}  memory       — current session memory from client
   * @param {Object}  res          — Express response for SSE
   */
  async processRequest(userMessage, user, reqHeaders, chatHistory = [], memory = {}, res) {
    const globalStart    = Date.now();
    const requestId      = crypto.randomBytes(3).toString('hex').toUpperCase();
    const sessionId      = reqHeaders['x-session-id']      || 'anonymous';
    const conversationId = reqHeaders['x-conversation-id'] || 'none';

    console.log(`\n${'═'.repeat(64)}`);
    console.log(`[PIPELINE:${requestId}] V13 NEW REQUEST`);
    console.log(`[PIPELINE:${requestId}]  Session   : ${sessionId}`);
    console.log(`[PIPELINE:${requestId}]  User      : ${user?._id || 'guest'}`);
    console.log(`[PIPELINE:${requestId}]  Message   : "${userMessage}"`);
    console.log(`[PIPELINE:${requestId}]  Memory    :`, JSON.stringify(memory).slice(0, 120));
    console.log(`${'─'.repeat(64)}`);

    // Helper: write SSE frame safely
    const write = (payload) => {
      if (!res.writableEnded) {res.write(`data: ${payload}\n\n`);}
    };
    const done = () => {
      if (!res.writableEnded) { write('data: [DONE]\n\n'); res.end(); }
    };

    try {
      // ── STATUS 1: Understanding ───────────────────────────────────────────
      write(responseFormatter.serializeStatus('Understanding your request...', 1));

      // ── STAGE 1: Intent Detection (with session memory) ───────────────────
      log.stage(requestId, '1 — Intent Detection', { message: userMessage });
      const s1 = Date.now();
      const detectedIntent = intentDetector.detectIntent(userMessage, memory);
      log.ok(requestId, 'Intent', `intent=${detectedIntent.intent} confidence=${detectedIntent.confidence}`, Date.now() - s1);

      let rankedProducts = [];
      let finalContext   = {};
      let resolverMeta   = { confidence: 0, appliedFilters: {} };

      if (detectedIntent.needsDB || detectedIntent.needsRules) {
        // ── STATUS 2: Searching ─────────────────────────────────────────────
        write(responseFormatter.serializeStatus('Searching verified inventory...', 2));

        // ── STAGE 2: Context Builder ────────────────────────────────────────
        log.stage(requestId, '2 — Context Builder');
        const s2 = Date.now();
        finalContext = await contextBuilder.buildContext(user, detectedIntent);
        log.ok(requestId, 'Context', `keys=${Object.keys(finalContext).join(', ')}`, Date.now() - s2);

        // ── STAGE 2.5: AI State Machine ─────────────────────────────────────
        const aiStateMachine = require('./aiStateMachine');
        const currentState   = finalContext.preferences?.aiState || 'GREETING';
        const nextState      = aiStateMachine.transition(currentState, detectedIntent.intent, []);
        finalContext.aiState = nextState;

        // ── STAGE 3: Product Resolver (cumulative memory filters) ────────────
        if (detectedIntent.needsDB) {
          log.stage(requestId, '3 — Product Resolver', { entities: detectedIntent.entities });
          const s3 = Date.now();
          const resolvedData  = await productResolver.resolveProducts(detectedIntent.entities, memory);
          const rawProducts   = resolvedData.products;
          resolverMeta        = { confidence: resolvedData.confidence, appliedFilters: resolvedData.appliedFilters };
          log.ok(requestId, 'Resolver', `products=${rawProducts.length}`, Date.now() - s3);

          // STATUS 3: Checking availability
          write(responseFormatter.serializeStatus('Checking availability...', 3));

          // ── STAGE 3.5: Anti-Fatigue ──────────────────────────────────────
          const recommendationMemory = require('../memory/recommendationMemory');
          const freshProducts = recommendationMemory.filterRepeatedRecommendations(rawProducts, sessionId);

          // ── STAGE 4: Policy Engine ───────────────────────────────────────
          log.stage(requestId, '4 — Policy Engine');
          const s4 = Date.now();
          const safeProducts = policyEngine.enforceRules(freshProducts, finalContext.preferences || {});
          log.ok(requestId, 'Policy', `${freshProducts.length} → ${safeProducts.length}`, Date.now() - s4);

          // STATUS 4: Ranking
          write(responseFormatter.serializeStatus('Ranking recommendations...', 4));

          // ── STAGE 5: Ranking Engine ──────────────────────────────────────
          log.stage(requestId, '5 — Ranking Engine');
          const s5 = Date.now();
          rankedProducts = rankingService.rankProducts(safeProducts, {
            ...finalContext.preferences,
            preferredBrands: detectedIntent.entities.brands,
            budget: detectedIntent.entities.budget,
          });
          log.ok(requestId, 'Ranking', `→ ${rankedProducts.length} products`, Date.now() - s5);

          // Emit session summary frame
          write(responseFormatter.serializeSession(
            userMessage,
            rankedProducts.length,
            resolverMeta.appliedFilters,
          ));
        }
      } else {
        console.log(`[PIPELINE:${requestId}] ⏭️  STAGES 2-5 — Skipped (needsDB=false)`);
      }

      // ── STATUS 5: Curating ───────────────────────────────────────────────
      write(responseFormatter.serializeStatus('Curating your collection...', 5));

      // Send deterministic products immediately (before Gemini text)
      if (rankedProducts.length > 0) {
        const explanations = explanationService.formatExplanations(rankedProducts);
        write(responseFormatter.serializeProducts(explanations, detectedIntent.intent, globalStart));
        console.log(`[PIPELINE:${requestId}]  Products sent: ${rankedProducts.length}`);
      }

      if (!detectedIntent.needsGemini) {
        console.log(`[PIPELINE:${requestId}] ⏭️  Gemini skipped`);
        if (rankedProducts.length > 0) {
          write(responseFormatter.serializeStreamChunk("I've curated the finest matches from our verified catalog. Our AI advisor will be with you momentarily — feel free to refine your preferences."));
        } else {
          write(responseFormatter.serializeStreamChunk("Our advisor is momentarily at capacity. I've prepared curated recommendations. Please try again in a moment."));
        }
        done();
        return;
      }

      // ── STAGE 6: Prompt Builder ──────────────────────────────────────────
      log.stage(requestId, '6 — Prompt Builder');
      const s6 = Date.now();
      const summarizer      = require('../memory/summarizer');
      const sessionTimeline = require('../memory/sessionTimeline');
      const compressedHistory = summarizer.compress(chatHistory);
      const timelineStr       = sessionTimeline.formatTimelineForPrompt(sessionId);

      // Inject session memory into context for prompt
      finalContext.sessionMemory = memory;
      const prompt = promptBuilder.buildPrompt(finalContext, rankedProducts, userMessage, compressedHistory, timelineStr);
      log.ok(requestId, 'Prompt', `chars=${prompt.length}`, Date.now() - s6);

      // ── STAGE 7: Model Router (Gemini stream) ────────────────────────────
      log.stage(requestId, '7 — Model Router');
      const s7 = Date.now();
      let stream;
      try {
        stream = await modelRouter.streamResponse(detectedIntent.intent, prompt);
      } catch (routerError) {
        log.fail(requestId, 'STAGE 7 — Model Router', routerError);
        const diagMsg = buildDiagnosticError(requestId, 'Model Router', routerError);
        // Fallback: show products + error message
        if (rankedProducts.length === 0) {
          const fallbackProducts = await this._getFallback();
          if (fallbackProducts.length > 0) {
            const expl = explanationService.formatExplanations(fallbackProducts);
            write(responseFormatter.serializeProducts(expl, 'product-search', globalStart));
          }
        }
        write(responseFormatter.serializeStreamChunk(diagMsg));
        done();
        return;
      }
      log.ok(requestId, 'Model Router', 'stream acquired', Date.now() - s7);

      // ── Stream Text ──────────────────────────────────────────────────────
      let fullResponse = '';
      let chunkCount   = 0;
      for await (const chunkText of stream) {
        fullResponse += chunkText;
        chunkCount++;
        write(responseFormatter.serializeStreamChunk(chunkText));
      }
      log.ok(requestId, 'Streaming', `${chunkCount} chunks, ${fullResponse.length} chars`, Date.now() - s7);

      // ── STAGE 8: Response Guard ──────────────────────────────────────────
      const guardResult = responseGuard.validateResponse(fullResponse, rankedProducts);
      if (!guardResult.isValid) {
        write(responseFormatter.serializeError(guardResult.safeResponse));
      }

      // ── Extract + Emit AI-triggered actions ─────────────────────────────
      const autoActions = extractActionsFromResponse(fullResponse, rankedProducts);
      for (const act of autoActions) {
        write(JSON.stringify(act));
      }

      // ── Metadata ─────────────────────────────────────────────────────────
      const responseScoring = require('../guard/responseScoring');
      const scores = responseScoring.calculateScore(fullResponse, rankedProducts, finalContext);
      write(JSON.stringify({ type: 'METADATA', scores }));

      done();
      log.summary(requestId, Date.now() - globalStart);

    } catch (error) {
      log.fail(requestId, 'OUTER CATCH', error);
      const diagMsg = buildDiagnosticError(requestId, 'Pipeline', error);
      try {
        // Try to emit fallback products
        const fallbackProducts = await this._getFallback();
        if (fallbackProducts.length > 0) {
          const expl = explanationService.formatExplanations(fallbackProducts);
          write(responseFormatter.serializeProducts(expl, 'product-search', globalStart));
        }
      } catch (_) { /* ignore fallback errors */ }
      write(responseFormatter.serializeStreamChunk(diagMsg));
      done();
    }
  }

  /** Returns 6 top-rated products as a reliable fallback */
  async _getFallback() {
    try {
      const Product = require('../../../models/Product');
      return await Product.find({ isActive: true, stock: { $gt: 0 } })
        .populate('category', 'name')
        .select('name brand price discountPrice stock images slug category ratings')
        .sort({ 'ratings.average': -1 })
        .limit(6)
        .lean();
    } catch (_) {
      return [];
    }
  }
}

module.exports = new PipelineService();
