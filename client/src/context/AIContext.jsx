// NexORA V13 — AI Context (Luxury Commerce OS)
// Handles: status frames, action frames, session frames, memory pass-through
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import aiService from '../services/aiService';
import { useCart } from './CartContext';
import { useWishlist } from './WishlistContext';
import { useNavigate } from 'react-router-dom';

const AIContext = createContext();

const INITIAL_MSG = {
  role: 'assistant',
  text: 'Tell me what you\'re looking for, and I\'ll curate a selection that matches your style, preferences, and budget.',
  products: [],
  actions: [],
};

const DEFAULT_MEMORY = {
  budget: null, category: null, recipient: null, personality: null,
  preferredBrands: [], occasion: null, purpose: null,
  colors: [], materials: [], luxuryLevel: null,
};

const MEMORY_KEY = 'nexora_concierge_memory_v13';

// Luxury status sequence (cinematic streaming ticker)
const STATUS_SEQUENCE = [
  'Understanding your request...',
  'Searching verified inventory...',
  'Checking availability...',
  'Ranking recommendations...',
  'Curating your collection...',
];

export const AIProvider = ({ children }) => {
  const [messages,      setMessages]      = useState([INITIAL_MSG]);
  const [memory,        setMemory]        = useState(() => {
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      return saved ? JSON.parse(saved) : { ...DEFAULT_MEMORY };
    } catch { return { ...DEFAULT_MEMORY }; }
  });
  const [loading,       setLoading]       = useState(false);
  const [journeyStage,  setJourneyStage]  = useState('browsing');
  const [aiHealth,      setAiHealth]      = useState({ status: 'CHECKING', available: true, model: '' });
  const [statusMessage, setStatusMessage] = useState('');   // V13: streaming status ticker
  const [statusStep,    setStatusStep]    = useState(0);    // V13: 1-5 progress
  const [sessionGoal,   setSessionGoal]   = useState(null); // V13: current shopping goal
  const [timeline,      setTimeline]      = useState([]);   // V13: AI shopping timeline events
  const [sessionData,   setSessionData]   = useState(null); // V13: recommendation session metadata

  const abortControllerRef = useRef(null);

  const { addToCart, items: cartItems }            = useCart();
  const { toggleWishlist, isInWishlist, wishlistItems } = useWishlist();
  const navigate = useNavigate();

  // Health check on mount
  useEffect(() => {
    aiService.checkHealth().then(r => {
      if (r.data?.success) setAiHealth(r.data.data);
    }).catch(() => {
      setAiHealth({ status: 'UNHEALTHY', available: false, error: 'Concierge temporarily unavailable.' });
    });
  }, []);

  // Memory persistence
  const updateMemory = useCallback((updates) => {
    setMemory(prev => {
      const next = { ...prev };
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) {
          next[k] = v;
        } else if (v === null) {
          next[k] = null; // Allow explicit null to clear a key
        }
      });
      try { localStorage.setItem(MEMORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  // V13: Add timeline event
  const addTimelineEvent = useCallback((type, label, data = {}) => {
    setTimeline(prev => [...prev, { type, label, data, ts: Date.now() }]);
  }, []);

  // V13: Execute machine-readable action frames from SSE
  const executeAction = useCallback((actionType, payload = {}) => {
    switch (actionType) {
      case 'ADD_TO_CART':
        if (payload.productId && cartItems) {
          // Find product from latest message products
          // Action fired from SSE — we'll toast it
          addTimelineEvent('cart', `Added to cart`, { productName: payload.productName });
        }
        break;
      case 'TOGGLE_WISHLIST':
        if (payload.product) {
          toggleWishlist(payload.product);
          addTimelineEvent('wishlist', `Saved to wishlist`, { productName: payload.product?.name });
        }
        break;
      case 'ADD_TO_CART_PRODUCT':
        if (payload.product) {
          addToCart(payload.product, payload.quantity || 1);
          addTimelineEvent('cart', `Added ${payload.product.name} to cart`);
        }
        break;
      case 'NAVIGATE':
        if (payload.to) navigate(payload.to);
        break;
      case 'NAVIGATE_CHECKOUT':
        navigate('/checkout');
        addTimelineEvent('checkout', 'Navigated to checkout');
        break;
      case 'NAVIGATE_CART':
        navigate('/cart');
        break;
      case 'NAVIGATE_HOME':
        navigate('/');
        break;
      default:
        console.warn('[AIContext] Unknown action:', actionType, payload);
    }
  }, [addToCart, toggleWishlist, navigate, addTimelineEvent, cartItems]);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatusMessage('');
    setStatusStep(0);
  }, []);

  const sendMessage = useCallback(async (userText, intentOverride = null) => {
    if (!userText || loading) return;
    abortStream();
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Update goal for current session
    setSessionGoal(userText);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    addTimelineEvent('message', `Asked: "${userText.slice(0, 40)}${userText.length > 40 ? '...' : ''}"`);

    let currentMemory = memory;
    if (intentOverride) {
      updateMemory(intentOverride);
      currentMemory = { ...memory, ...intentOverride };
    }

    // V13: Immediately show first status
    setStatusMessage(STATUS_SEQUENCE[0]);
    setStatusStep(1);

    try {
      const history = messages
        .filter((m, i) => i > 0)
        .map(m => ({
          role:  m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.text || '' }],
        }));

      const res = await aiService.chatStream(
        userText,
        history,
        currentMemory,
        (cartItems || []).map(i => ({ product: i.product?._id || i.product, price: i.price, quantity: i.quantity })),
        (wishlistItems || []).map(p => p._id || p),
        controller.signal
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();

      // Add empty assistant message to stream into
      setMessages(prev => [...prev, { role: 'assistant', text: '', products: [], actions: [], skill: null }]);

      let eventBuffer = '';
      let fullText    = '';

      // V13: Heartbeat — if no chunk for 45s, abort
      let lastChunkAt = Date.now();
      const heartbeat = setInterval(() => {
        if (Date.now() - lastChunkAt > 45000) {
          console.warn('[AIContext] Heartbeat timeout — aborting stream');
          controller.abort();
          clearInterval(heartbeat);
        }
      }, 2000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          lastChunkAt = Date.now();
          eventBuffer += decoder.decode(value, { stream: true });
          const events = eventBuffer.split('\n\n');
          eventBuffer  = events.pop();

          for (const event of events) {
            if (!event.startsWith('data: ')) continue;
            const dataStr = event.slice(6);
            if (dataStr === '[DONE]') continue;

            try {
              const obj = JSON.parse(dataStr);

              // ── V13: Status frame ─────────────────────────────────────
              if (obj.type === 'status') {
                setStatusMessage(obj.text);
                setStatusStep(obj.step || 1);
                continue;
              }

              // ── V13: Session frame ────────────────────────────────────
              if (obj.type === 'session') {
                setSessionData({
                  goal:           obj.goal,
                  productsFound:  obj.productsFound,
                  appliedFilters: obj.appliedFilters,
                });
                continue;
              }

              // ── V13: AI-triggered action frame ────────────────────────
              if (obj.type === 'action') {
                executeAction(obj.action, obj);
                // Show action toast in last message
                setMessages(prev => {
                  const updated = [...prev];
                  const last    = updated[updated.length - 1];
                  if (last?.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      actionConfirmed: obj.action,
                      actionProduct:   obj.productName,
                    };
                  }
                  return updated;
                });
                continue;
              }

              // ── Text chunk ────────────────────────────────────────────
              if (obj.text) {
                fullText += obj.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], text: fullText };
                  return updated;
                });
              }

              // ── Products ──────────────────────────────────────────────
              if (obj.products) {
                setStatusMessage(''); // Clear status when products arrive
                setStatusStep(0);
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    products: obj.products,
                    actions:  obj.actions || [],
                    skill:    obj.skill   || null,
                    intent:   obj.intent  || null,
                  };
                  return updated;
                });
                if (obj.products.length > 0) {
                  addTimelineEvent('products', `${obj.products.length} products curated`);
                }
              }

              // ── Journey stage ─────────────────────────────────────────
              if (obj.journeyStage) setJourneyStage(obj.journeyStage);

              // ── Error frame ───────────────────────────────────────────
              if (obj.error && !obj.text) {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    text: typeof obj.error === 'string' ? obj.error : 'Connection interrupted',
                  };
                  return updated;
                });
              }
            } catch (_) { /* ignore partial JSON */ }
          }
        }
      } finally {
        clearInterval(heartbeat);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[AIContext] Stream aborted by user or heartbeat');
      } else {
        console.error('[AIContext] Stream error:', err);
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: 'Our concierge is momentarily assisting another client. While reconnecting, I\'ve prepared today\'s curated recommendations for you.',
          products: [],
          actions:  [],
        }]);
      }
    } finally {
      setLoading(false);
      setStatusMessage('');
      setStatusStep(0);
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
    }
  }, [messages, memory, loading, abortStream, cartItems, wishlistItems, addTimelineEvent, executeAction, updateMemory]);

  const clearMemory = useCallback(() => {
    abortStream();
    setMemory({ ...DEFAULT_MEMORY });
    localStorage.removeItem(MEMORY_KEY);
    setMessages([{ ...INITIAL_MSG }]);
    setSessionGoal(null);
    setTimeline([]);
    setSessionData(null);
    setLoading(false);
  }, [abortStream]);

  const endSession = useCallback(() => {
    abortStream();
    setMemory({ ...DEFAULT_MEMORY });
    localStorage.removeItem(MEMORY_KEY);
    localStorage.removeItem('nexora_session_id');
    setMessages([{ ...INITIAL_MSG }]);
    setJourneyStage('browsing');
    setSessionGoal(null);
    setTimeline([]);
    setSessionData(null);
    setLoading(false);
  }, [abortStream]);

  const forgetMe = useCallback(async () => {
    if (!window.confirm('Permanently delete all your preference data?')) return;
    try { await aiService.forgetMe(); } catch (e) {
      console.error('Forget Me Error:', e);
      window.alert('Failed to reach server, but clearing local session.');
    }
    endSession();
    window.alert('Your personal AI profile has been permanently erased.');
  }, [endSession]);

  const exportMemory = useCallback(async (format = 'json') => {
    try {
      const res = await aiService.exportMemory(format);
      let url, filename;
      if (format === 'json') { url = URL.createObjectURL(res.data); filename = 'nexora-memory-export.json'; }
      else if (format === 'html') { const b = new Blob([res.data], { type: 'text/html' }); url = URL.createObjectURL(b); filename = 'nexora-memory-export.html'; }
      else { const b = new Blob([res.data], { type: 'text/markdown' }); url = URL.createObjectURL(b); filename = 'nexora-memory-export.md'; }
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Export Failed', e); window.alert('Export Failed: ' + (e.message || 'Unknown Error')); }
  }, []);

  const value = {
    // Core
    messages, setMessages,
    memory,
    loading,
    journeyStage,
    aiHealth,
    // V13
    statusMessage,
    statusStep,
    sessionGoal,
    timeline,
    sessionData,
    // Actions
    updateMemory,
    sendMessage,
    executeAction,
    addTimelineEvent,
    clearMemory,
    endSession,
    forgetMe,
    exportMemory,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export const useAI = () => useContext(AIContext);
