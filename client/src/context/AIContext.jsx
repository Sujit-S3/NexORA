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
  actions: []
};

const DEFAULT_MEMORY = {
  budget: null, category: null, recipient: null, personality: null,
  preferredBrands: [], occasion: null, purpose: null,
  colors: [], materials: [], luxuryLevel: null
};

const MEMORY_KEY = 'nexora_concierge_memory_v12';

export const AIProvider = ({ children }) => {
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [memory, setMemory] = useState(() => {
    try {
      const saved = localStorage.getItem(MEMORY_KEY);
      return saved ? JSON.parse(saved) : { ...DEFAULT_MEMORY };
    } catch { return { ...DEFAULT_MEMORY }; }
  });
  const [loading, setLoading] = useState(false);
  const [journeyStage, setJourneyStage] = useState('browsing');
  const [aiHealth, setAiHealth] = useState({ status: 'CHECKING', available: true, model: '' });
  const abortControllerRef = useRef(null);

  const { addToCart, items: cartItems } = useCart();
  const { toggleWishlist, wishlistItems } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    aiService.checkHealth().then(r => {
      if (r.data?.success) setAiHealth(r.data.data);
    }).catch(() => {
      setAiHealth({ status: 'UNHEALTHY', available: false, error: 'Concierge temporarily unavailable.' });
    });
  }, []);

  const updateMemory = useCallback((updates) => {
    setMemory(prev => {
      const next = { ...prev };
      Object.entries(updates).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) {
          next[k] = v;
        }
      });
      try { localStorage.setItem(MEMORY_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const executeAction = useCallback((actionType, payload) => {
    switch (actionType) {
      case 'ADD_TO_CART':
        if (payload.product) addToCart(payload.product, payload.quantity || 1);
        break;
      case 'TOGGLE_WISHLIST':
        if (payload.product) toggleWishlist(payload.product);
        break;
      case 'NAVIGATE_CHECKOUT':
        navigate('/checkout');
        break;
      case 'NAVIGATE_CART':
        navigate('/cart');
        break;
      case 'NAVIGATE_HOME':
        navigate('/');
        break;
      default:
        console.warn('Unknown AI Action:', actionType);
    }
  }, [addToCart, toggleWishlist, navigate]);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (userText, intentOverride = null) => {
    if (!userText || loading) return;
    abortStream(); // Abort any ongoing stream
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages(prev => [...prev, { role: 'user', text: userText }]);

    let currentMemory = memory;
    if (intentOverride) {
      updateMemory(intentOverride);
      currentMemory = { ...memory, ...intentOverride };
    }

    try {
      const history = messages
        .filter((m, i) => i > 0)
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));

      const res = await aiService.chatStream(
        userText, history, currentMemory,
        (cartItems || []).map(i => ({ product: i.product?._id || i.product, price: i.price, quantity: i.quantity })),
        (wishlistItems || []).map(p => p._id || p),
        controller.signal
      );

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      setMessages(prev => [...prev, { role: 'assistant', text: '', products: [], actions: [] }]);

      let eventBuffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        eventBuffer += decoder.decode(value, { stream: true });
        const events = eventBuffer.split('\n\n');
        eventBuffer = events.pop();

        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          const dataStr = event.slice(6);
          if (dataStr === '[DONE]') continue;

          try {
            const obj = JSON.parse(dataStr);
            if (obj.text) {
              fullText += obj.text;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], text: fullText };
                return updated;
              });
            }
            if (obj.products) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  products: obj.products,
                  actions: obj.actions || [],
                  skill: obj.skill || null,
                };
                return updated;
              });
            }
            if (obj.journeyStage) setJourneyStage(obj.journeyStage);
            if (obj.error && !obj.text) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { 
                  ...updated[updated.length - 1], 
                  text: typeof obj.error === 'string' ? obj.error : "Connection interrupted" 
                };
                return updated;
              });
            }
          } catch (e) { /* ignore partial json */ }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted');
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          text: 'Our concierge is momentarily assisting another client. While reconnecting, I\'ve prepared today\'s curated recommendations for you.',
          products: [],
          actions: []
        }]);
      }
    } finally {
      setLoading(false);
      if (abortControllerRef.current === controller) abortControllerRef.current = null;
    }
  }, [messages, memory, loading, abortStream, cartItems, wishlistItems]);

  const clearMemory = useCallback(() => {
    abortStream();
    setMemory({ ...DEFAULT_MEMORY });
    localStorage.removeItem(MEMORY_KEY);
    setMessages([{ ...INITIAL_MSG }]);
    setLoading(false);
  }, [abortStream]);

  const endSession = useCallback(() => {
    abortStream();
    setMemory({ ...DEFAULT_MEMORY });
    localStorage.removeItem(MEMORY_KEY);
    localStorage.removeItem('nexora_session_id');
    setMessages([{ ...INITIAL_MSG }]);
    setJourneyStage('browsing');
    setLoading(false);
  }, [abortStream]);

  const forgetMe = useCallback(async () => {
    if (!window.confirm('Permanently delete all your preference data?')) return;
    try {
      await aiService.forgetMe();
    } catch (e) {
      console.error("Forget Me Error:", e);
      window.alert("Failed to reach server, but clearing local session.");
    }
    endSession();
    window.alert('Your personal AI profile has been permanently erased. A new profile will be created as you continue shopping.');
  }, [endSession]);

  const exportMemory = useCallback(async (format = 'json') => {
    try {
      const res = await aiService.exportMemory(format);
      let url, filename;
      
      if (format === 'json') {
         url = URL.createObjectURL(res.data);
         filename = 'nexora-memory-export.json';
      } else if (format === 'html') {
         const blob = new Blob([res.data], { type: 'text/html' });
         url = URL.createObjectURL(blob);
         filename = 'nexora-memory-export.html';
      } else {
         const blob = new Blob([res.data], { type: 'text/markdown' });
         url = URL.createObjectURL(blob);
         filename = 'nexora-memory-export.md';
      }
      
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = filename; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export Failed", e);
      window.alert("Export Failed: " + (e.message || "Unknown Error"));
    }
  }, []);

  const value = {
    messages,
    memory,
    loading,
    journeyStage,
    aiHealth,
    updateMemory,
    sendMessage,
    executeAction,
    clearMemory,
    endSession,
    forgetMe,
    exportMemory
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export const useAI = () => useContext(AIContext);
