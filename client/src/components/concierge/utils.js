export function getProductImage(product, fallback) {
  const categoryName = typeof product?.category === 'object' ? product?.category?.name : product?.category;
  return product?.images?.[0]?.url || product?.image || (fallback ? fallback(categoryName) : '');
}

export function formatStageLabel(stage) {
  if (!stage) return 'Browsing';
  return String(stage)
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export function formatProfileValue(key, value) {
  if (value == null || value === '') return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (key === 'budget') {
    const numeric = Number(String(value).replace(/[^\d.]/g, ''));
    return Number.isFinite(numeric) && numeric > 0
      ? `Rs. ${numeric.toLocaleString('en-IN')}`
      : String(value);
  }
  return formatStageLabel(value);
}

export function getProfileConfidence(memory = {}, sessionData = {}) {
  const explicit = memory?.confidence ?? sessionData?.profileConfidence ?? sessionData?.confidence;
  if (Number.isFinite(Number(explicit))) return Math.min(100, Math.max(0, Number(explicit)));

  const keys = ['budget', 'preferredBrands', 'category', 'recipient', 'occasion', 'materials', 'colors', 'style'];
  const filled = keys.filter(key => {
    const value = memory[key];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;

  return Math.round((filled / keys.length) * 100);
}

export function compactFilters(filters = {}) {
  return Object.entries(filters)
    .filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== '';
    })
    .map(([key, value]) => ({
      key,
      label: formatStageLabel(key),
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }));
}

export function buildRecommendationSessions(messages = [], sessionData = {}, sessionGoal = '') {
  const sessions = [];
  let current = null;

  messages.forEach((message, index) => {
    if (!message) return;

    if (message.role === 'user') {
      current = {
        id: `session-${index}`,
        goal: message.text || sessionGoal || 'Luxury shopping request',
        userPrompt: message.text || '',
        detectedIntent: message.intent || sessionData?.detectedIntent || sessionData?.intent || 'Shopping request',
        filtersApplied: message.filtersApplied || sessionData?.appliedFilters || {},
        products: [],
        productsFound: 0,
        recommendationReason: '',
        suggestedActions: [],
        explanation: '',
        skill: null,
        actionConfirmed: null,
        actionProduct: null,
        createdAt: message.ts || message.createdAt || Date.now(),
      };
      sessions.push(current);
      return;
    }

    if (message.role !== 'assistant') return;

    if (!current) {
      const hasSessionPayload = message.products?.length || message.actions?.length;
      if (!hasSessionPayload) return;
      current = {
        id: `session-${index}`,
        goal: sessionGoal || 'Concierge recommendation',
        userPrompt: '',
        detectedIntent: message.intent || sessionData?.detectedIntent || sessionData?.intent || 'Recommendation',
        filtersApplied: message.filtersApplied || sessionData?.appliedFilters || {},
        products: [],
        productsFound: 0,
        recommendationReason: '',
        suggestedActions: [],
        explanation: '',
        skill: null,
        actionConfirmed: null,
        actionProduct: null,
        createdAt: message.ts || message.createdAt || Date.now(),
      };
      sessions.push(current);
    }

    if (message.products?.length) {
      const known = new Set(current.products.map(product => product._id || product.slug || product.name));
      message.products.forEach(product => {
        const key = product._id || product.slug || product.name;
        if (!known.has(key)) {
          current.products.push(product);
          known.add(key);
        }
      });
    }

    if (message.text) {
      current.explanation = [current.explanation, message.text].filter(Boolean).join('\n');
      current.recommendationReason = message.recommendationReason || current.recommendationReason || message.text;
    }

    if (message.actions?.length) {
      current.suggestedActions = [...new Set([...current.suggestedActions, ...message.actions])];
    }

    current.skill = message.skill || current.skill;
    current.actionConfirmed = message.actionConfirmed || current.actionConfirmed;
    current.actionProduct = message.actionProduct || current.actionProduct;
    current.detectedIntent = message.detectedIntent || message.intent || current.detectedIntent;
    current.filtersApplied = message.filtersApplied || current.filtersApplied;
    current.productsFound = current.products.length || message.productsFound || sessionData?.productsFound || 0;
  });

  return sessions.map(session => ({
    ...session,
    productsFound: session.products.length || session.productsFound || 0,
    filters: compactFilters(session.filtersApplied),
  }));
}

export function shouldShowRetry(session, isLatest, loading) {
  if (!session?.explanation || !isLatest || loading) return false;
  const text = session.explanation.toLowerCase();
  return text.includes('peak capacity') || text.includes('try again') || text.includes('[ref:');
}
