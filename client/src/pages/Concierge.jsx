// NexORA V10 — Luxury AI Concierge
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Sparkles, X, RotateCcw, ShoppingBag, Eye, Star,
  ChevronRight, ChevronLeft, Heart, ArrowRight, GitCompare,
  Zap, Clock, Download, Trash2, Map, Package, CreditCard, Gift
} from 'lucide-react';

import { Link } from 'react-router-dom';
import aiService from '@services/aiService';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { useAI } from '@context/AIContext';
import axios from 'axios';
import { getSessionId } from '../hooks/usePreferenceTracking';
import { getLuxuryFallback } from '../utils/getLuxuryFallback';
import { formatPrice } from '../utils/formatPrice';
import LuxuryBackground from '../components/layout/LuxuryBackground';
import { trackAIConversationStarted, trackAIMessageSent, trackAIRecommendationClick } from '@services/analyticsService';

// ── Constants ──────────────────────────────────────────────────────────────────
const MEMORY_KEY = 'nexora_concierge_memory_v10';

// Journey stages — V10
const JOURNEY_STAGES = [
  { id: 'browsing',   label: 'Browsing',    icon: Map },
  { id: 'discovery',  label: 'Discovery',   icon: Sparkles },
  { id: 'comparison', label: 'Comparison',  icon: GitCompare },
  { id: 'selection',  label: 'Selection',   icon: Star },
  { id: 'cart',       label: 'Cart',        icon: ShoppingBag },
  { id: 'checkout',   label: 'Checkout',    icon: CreditCard },
  { id: 'aftercare',  label: 'Aftercare',   icon: Package },
];


const INITIAL_MSG = {
  role: 'assistant',
  text: 'Tell me what you\'re looking for, and I\'ll curate a selection that matches your style, preferences, and budget.',
  products: [],
  actions: []
};

const HOME_CATEGORIES = [
  { title: 'Recommended Today', prompt: 'Show me today\'s top recommendations.',      gradient: 'from-gray-100 dark:from-[#1a1a1a] to-white dark:to-[#0d0d0d]' },
  { title: 'CEO Collection',    prompt: 'I want executive picks for a CEO.',           gradient: 'from-amber-50 dark:from-[#1a1208] to-white dark:to-[#0d0d0d]' },
  { title: 'Luxury Watches',    prompt: 'Show me premium luxury watches.',             gradient: 'from-teal-50 dark:from-[#0d1a1a] to-white dark:to-[#0d0d0d]' },
  { title: 'Designer Bags',     prompt: 'Curate the finest designer bags.',            gradient: 'from-fuchsia-50 dark:from-[#1a0d1a] to-white dark:to-[#0d0d0d]' },
  { title: 'Gift Finder',       action: 'WIZARD',                                     gradient: 'from-yellow-50 dark:from-[#1a1a08] to-white dark:to-[#0d0d0d]' },
  { title: 'New Arrivals',      prompt: 'What are the latest luxury arrivals?',        gradient: 'from-indigo-50 dark:from-[#0d0d1a] to-white dark:to-[#0d0d0d]' },
];

const WIZARD_STEPS = [
  { id: 'recipient',   title: 'Who is this gift for?',     options: ['CEO', 'Founder', 'Executive', 'Client', 'Partner', 'Family', 'Friend'] },
  { id: 'budget',      title: 'Select your budget.',        options: ['₹25,000', '₹50,000', '₹1,00,000', '₹2,00,000', '₹5,00,000+'] },
  { id: 'category',    title: 'Which category?',            options: ['Watches', 'Designer Bags', 'Technology', 'Jewellery', 'Accessories'] },
  { id: 'personality', title: 'Their personal style.',      options: ['Minimalist', 'Executive', 'Tech-Forward', 'Collector', 'Heritage Lover', 'Traveller'] },
];

const DEFAULT_MEMORY = {
  budget: null, category: null, recipient: null, personality: null,
  preferredBrands: [], occasion: null, purpose: null,
  colors: [], materials: [], luxuryLevel: null
};

// ── Helpers ────────────────────────────────────────────────────────────────
const parseMemoryFromIntent = (intent) => {
  const m = {};
  if (intent.budget)        m.budget = intent.budget;
  if (intent.category)      m.category = intent.category;
  if (intent.brand)         m.brand = intent.brand;
  if (intent.recipient)     m.recipient = intent.recipient;
  if (intent.occasion)      m.occasion = intent.occasion;
  if (intent.purpose)       m.purpose = intent.purpose;
  if (intent.preferredBrands?.length) m.preferredBrands = intent.preferredBrands;
  if (intent.colors?.length)          m.colors = intent.colors;
  if (intent.materials?.length)       m.materials = intent.materials;
  if (intent.luxuryLevel)             m.luxuryLevel = intent.luxuryLevel;
  return m;
};

// ── Sub-components ─────────────────────────────────────────────────────────
const DiscoveryRow = ({ title, products, onProduct }) => {
  const [idx, setIdx] = useState(0);
  if (!products?.length) return null;
  return (
    <div className="mb-10 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-playfair text-lg text-gray-900 dark:text-white">{title}</h3>
        <div className="flex gap-1.5">
          <button onClick={() => setIdx(i => Math.max(0, i - 1))}
            className="w-7 h-7 rounded border border-gray-200 dark:border-[#222] flex items-center justify-center hover:border-[#D4AF37] transition-colors">
            <ChevronLeft size={12} className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400" />
          </button>
          <button onClick={() => setIdx(i => Math.min(Math.max(0, products.length - 4), i + 1))}
            className="w-7 h-7 rounded border border-gray-200 dark:border-[#222] flex items-center justify-center hover:border-[#D4AF37] transition-colors">
            <ChevronRight size={12} className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {products.slice(idx, idx + 4).map(p => (
          <Link key={p._id} to={`/product/${p.slug}`}
            className="bg-white dark:bg-[#0B0B0B] p-3 rounded-xl border border-gray-200 dark:border-[#1A1A1A] hover:border-[#D4AF37]/50 transition-all group block">
            {p.matchScore > 55 && (
              <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded text-[8px] text-[#D4AF37] font-bold uppercase tracking-wider">
                <Sparkles size={7} /> {p.matchScore}% Match
              </div>
            )}
            <div className="h-28 flex items-center justify-center mb-3">
              <img loading="lazy" src={p.image || p.images?.[0]?.url || getLuxuryFallback(p.category?.name)} alt={p.name}
                className="max-h-full max-w-full object-contain dark:mix-blend-lighten mix-blend-multiply"
                onError={e => { 
                  if (e.currentTarget.src !== getLuxuryFallback(p.category?.name)) {
                    e.currentTarget.src = getLuxuryFallback(p.category?.name); 
                  }
                }} />
            </div>
            <p className="text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 uppercase tracking-widest mb-0.5">{p.brand}</p>
            <h4 className="font-playfair text-[13px] text-gray-900 dark:text-white truncate group-hover:text-[#D4AF37] transition-colors">{p.name}</h4>
            <div className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 font-light">{formatPrice(p.discountPrice || p.price)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const MemoryChip = ({ label, value, onRemove }) => (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-[10px] font-semibold tracking-wide">
    {label}: {String(value).includes('₹') ? value : String(value).charAt(0).toUpperCase() + String(value).slice(1)}
    <button onClick={onRemove} className="hover:text-gray-900 dark:text-white transition-colors ml-0.5">
      <X size={9} />
    </button>
  </div>
);

const ProductCard = ({ p, reasons, onAddCart, onToggleWishlist, isWishlisted, onCompare, inCompare }) => (
  <div className="snap-start shrink-0 w-[280px] bg-white dark:bg-[#0B0B0B] border border-gray-200 dark:border-[#222] rounded-xl overflow-hidden hover:border-[#D4AF37]/40 transition-all duration-300 group relative flex flex-col">
    {/* Rank Badge */}
    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-[#D4AF37]/30 text-[#D4AF37] text-[8px] uppercase tracking-widest font-bold rounded">
      {p.conciergeRank || 'Curated'}
    </div>
    {/* Match Score */}
    {p.matchScore > 0 && (
      <div className="absolute top-3 right-3 z-10 px-2.5 py-1 bg-black/80 backdrop-blur-md border border-[#D4AF37]/20 rounded">
        <span className="text-[#D4AF37] text-[9px] font-bold">{p.matchScore}%</span>
        <span className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 text-[8px] ml-0.5">Match</span>
      </div>
    )}
    {/* Wishlist */}
    <button onClick={() => onToggleWishlist(p)}
      className={`absolute bottom-[128px] right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-all border ${
        isWishlisted ? 'bg-white border-[#D4AF37] text-[#D4AF37]' : 'bg-black/40 border-white/20 text-gray-900 dark:text-white/50 hover:border-[#D4AF37] hover:text-[#D4AF37]'
      }`}>
      <Heart size={12} fill={isWishlisted ? '#D4AF37' : 'none'} />
    </button>
    {/* Image */}
    <div className="h-52 bg-gray-100 dark:bg-[#111] p-5 relative flex items-center justify-center border-b border-gray-200 dark:border-[#1A1A1A]">
      <img loading="lazy"
        src={p.image || p.images?.[0]?.url || getLuxuryFallback(p.category?.name)}
        alt={p.name}
        className="w-full h-full object-contain dark:mix-blend-lighten mix-blend-multiply"
        onError={e => { 
          if (e.currentTarget.src !== getLuxuryFallback(p.category?.name)) {
            e.currentTarget.src = getLuxuryFallback(p.category?.name); 
          }
        }} />
    </div>
    {/* Content */}
    <div className="p-4 flex flex-col flex-1">
      <div className="flex items-start justify-between mb-1">
        <p className="text-[9px] tracking-widest uppercase text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">{p.brand}</p>
        <div className={`text-[8px] uppercase tracking-wider font-bold ${p.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {p.stock > 0 ? 'In Stock' : 'Out of Stock'}
        </div>
      </div>
      <h4 className="font-playfair text-gray-900 dark:text-white text-[17px] leading-tight mb-0.5 line-clamp-1">{p.name}</h4>
      <p className="text-[9px] uppercase tracking-widest text-[#D4AF37] mb-3">{p.category?.name || 'Luxury'}</p>

      <div className="flex items-center justify-between mb-3">
        <span className="text-[18px] text-gray-900 dark:text-white font-light">{formatPrice(p.discountPrice || p.price)}</span>
        <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400">
          <Star size={10} className="text-[#D4AF37] fill-[#D4AF37]" />
          {p.ratings?.average?.toFixed(1) || '5.0'}
        </span>
      </div>

      {/* Confidence Breakdown */}
      {p.matchedBy?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {p.matchedBy.map((m, i) => (
            <span key={i} className="text-[8px] px-1.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded border border-[#D4AF37]/20 font-medium">
              ✓ {m}
            </span>
          ))}
        </div>
      )}

      {/* Reason Badge */}
      {p.reasonBadge && (
        <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-semibold border border-[#D4AF37]/20 w-fit">
          <Sparkles size={10} /> {p.reasonBadge}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 mt-auto">
        <Link to={`/product/${p.slug}`}
          className="flex items-center justify-center gap-1 py-2.5 border border-gray-200 dark:border-[#222] text-gray-900 dark:text-white text-[9px] uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors rounded">
          <Eye size={10} /> View
        </Link>
        <button onClick={() => onAddCart(p, 1)} disabled={!p.stock}
          className="flex items-center justify-center gap-1 py-2.5 bg-[#D4AF37] text-black text-[9px] uppercase tracking-widest hover:bg-white transition-colors rounded font-bold disabled:opacity-30 disabled:cursor-not-allowed">
          <ShoppingBag size={10} /> {p.stock > 0 ? 'Add' : 'Sold'}
        </button>
        <button onClick={() => onCompare(p)}
          className={`flex items-center justify-center gap-1 py-2.5 border text-[9px] uppercase tracking-widest transition-colors rounded ${
            inCompare ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/10' : 'border-gray-200 dark:border-[#222] text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:border-[#D4AF37] hover:text-[#D4AF37]'
          }`}>
          <GitCompare size={10} /> {inCompare ? 'Added' : 'Compare'}
        </button>
      </div>
    </div>
  </div>
);

const CompareTable = ({ data, onClose }) => {
  if (!data) return null;
  const { rows, products, verdict, pros, cons } = data;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="ml-14 mt-4 w-[calc(100%-56px)] bg-white dark:bg-[#0B0B0B] border border-[#D4AF37]/30 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#1A1A1A]">
        <div className="flex items-center gap-2">
          <GitCompare size={16} className="text-[#D4AF37]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37]">Product Comparison</span>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Product Header Row */}
      {products && (
        <div className={`grid grid-cols-${products.length + 1} border-b border-gray-200 dark:border-[#1A1A1A]`}
          style={{ gridTemplateColumns: `180px repeat(${products.length}, 1fr)` }}>
          <div className="px-4 py-3 text-[9px] uppercase tracking-widest text-gray-600 font-bold">Attribute</div>
          {products.map(p => (
            <div key={p._id} className="px-4 py-3 border-l border-gray-200 dark:border-[#1A1A1A]">
              <div className="h-16 flex items-center justify-center mb-2">
                <img src={p.image || p.images?.[0]?.url || getLuxuryFallback(p.category?.name)} alt={p.name}
                  className="max-h-full max-w-full object-contain dark:mix-blend-lighten mix-blend-multiply"
                  onError={e => { 
                    if (e.currentTarget.src !== getLuxuryFallback(p.category?.name)) {
                      e.currentTarget.src = getLuxuryFallback(p.category?.name); 
                    }
                  }} />
              </div>
              <p className="text-[8px] text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 uppercase">{p.brand}</p>
              <p className="text-[12px] font-playfair text-gray-900 dark:text-white leading-tight">{p.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Rows */}
      {rows?.map((row, i) => (
        <div key={i} className={`border-b border-gray-200 dark:border-[#111] ${i % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-white dark:bg-[#0B0B0B]'}`}
          style={{ display: 'grid', gridTemplateColumns: `180px repeat(${row.values.length}, 1fr)` }}>
          <div className="px-4 py-3 text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 font-semibold">{row.field}</div>
          {row.values.map((v, j) => (
            <div key={j} className="px-4 py-3 border-l border-gray-200 dark:border-[#111] text-[12px] text-gray-900 dark:text-white font-light">{v}</div>
          ))}
        </div>
      ))}

      {/* Pros / Cons */}
      {products && (pros || cons) && (
        <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${products.length}, 1fr)` }}
          className="border-t border-gray-200 dark:border-[#222]">
          <div className="px-4 py-4 text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 font-semibold">Pros / Cons</div>
          {products.map(p => (
            <div key={p._id} className="px-4 py-4 border-l border-gray-200 dark:border-[#111]">
              {pros?.[p._id]?.map((pr, i) => (
                <p key={i} className="text-[11px] text-emerald-400 mb-1">✓ {pr}</p>
              ))}
              {cons?.[p._id]?.map((c, i) => (
                <p key={i} className="text-[11px] text-red-400/70 mb-1">✗ {c}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Verdict */}
      {verdict && (
        <div className="px-6 py-4 bg-[#D4AF37]/5 border-t border-[#D4AF37]/20 flex items-start gap-3">
          <Sparkles size={14} className="text-[#D4AF37] shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-bold mb-0.5">Concierge Recommendation</p>
            <p className="text-[13px] text-gray-900 dark:text-white font-playfair">
              <strong>{verdict.winner}</strong> — {verdict.reason}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ── Main Concierge Component ───────────────────────────────────────────────
export default function Concierge() {
  const { messages, memory, loading, journeyStage, aiHealth, updateMemory, sendMessage, executeAction, clearMemory, endSession, forgetMe, exportMemory } = useAI();
  const [input, setInput] = useState('');
  const [intentLoading, setIntentLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const ob = new MutationObserver(sync);
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => ob.disconnect();
  }, []);

  const removeMemoryKey = useCallback((key) => {
    updateMemory({ [key]: null });
  }, [updateMemory]);

  const [compareProducts, setCompareProducts] = useState([]);
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardData, setWizardData] = useState({});

  const [preChatRecs, setPreChatRecs] = useState({
    recommendedToday: [], ceoPicks: [], trendingLuxury: [],
    giftFinder: [], executiveEssentials: [], newArrivals: []
  });

  const scrollContainerRef = useRef(null);
  const { addToCart, items: cartItems }        = useCart();
  const { toggleWishlist, isInWishlist, wishlist } = useWishlist();

  // V10: active skill badge
  const [activeSkill, setActiveSkill] = useState(null);

  // Fetch pre-chat data + health check on mount
  useEffect(() => {
    axios.get('/api/preferences/concierge-discovery', { headers: { 'x-session-id': getSessionId() } })
      .then(r => { if (r.data.success) setPreChatRecs(r.data.data); })
      .catch(() => {});

    // Track AI session start
    trackAIConversationStarted();
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length, compareData]);

  const resetSession = useCallback(() => {
    clearMemory();
    setCompareProducts([]);
    setCompareData(null);
    setInput('');
  }, [clearMemory]);

  // Memory chips (non-empty, non-array, visible keys)
  const visibleMemoryKeys = Object.entries(memory).filter(([k, v]) =>
    v && !(Array.isArray(v) && v.length === 0) &&
    ['budget', 'category', 'recipient', 'occasion', 'brand'].includes(k)
  );

  const handleToggleCompare = useCallback((product) => {
    setCompareProducts(prev => {
      const exists = prev.some(p => p._id === product._id);
      if (exists) return prev.filter(p => p._id !== product._id);
      if (prev.length >= 3) return [...prev.slice(1), product]; // max 3
      return [...prev, product];
    });
    setCompareData(null);
  }, []);

  const runCompare = useCallback(async () => {
    if (compareProducts.length < 2) return;
    setCompareLoading(true);
    try {
      const res = await aiService.compareProducts(compareProducts.map(p => p._id));
      setCompareData(res.data.data);
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Here is a detailed comparison of the ${compareProducts.length} pieces you selected.`,
        products: [], actions: []
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'The comparison is temporarily unavailable. Please try again in a moment.',
        products: [], actions: []
      }]);
    } finally {
      setCompareLoading(false);
    }
  }, [compareProducts]);

  const startWizard = () => { setWizardOpen(true); setWizardStep(0); setWizardData({}); };

  const handleWizardSelection = (val) => {
    const step = WIZARD_STEPS[wizardStep];
    const newData = { ...wizardData, [step.id]: val };
    setWizardData(newData);
    updateMemory({ [step.id]: val });

    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(s => s + 1);
    } else {
      setWizardOpen(false);
      const budgetNum = newData.budget?.replace(/[₹,+]/g, '').trim();
      const prompt = `Gift for a ${newData.recipient}. Budget ${newData.budget}. Category: ${newData.category}. Style: ${newData.personality}.`;
      handleSendMessage(prompt, { recipient: newData.recipient, budget: budgetNum, category: newData.category, personality: newData.personality, purpose: 'gift' });

      // Track to DB
      axios.post('/api/preferences/track', {
        sessionId: getSessionId(),
        event: 'gift_finder',
        data: { budget: budgetNum, personality: newData.personality, recipient: newData.recipient }
      }).catch(() => {});
    }
  };

  const handleSendMessage = async (text, intentOverride = null) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput('');
    
    // Clear comparisons if new message
    setCompareProducts([]);
    setCompareData(null);

    await sendMessage(userText, intentOverride);
  };

  const handleAction = (action) => {
    if (action === 'Compare Products' && compareProducts.length >= 2) {
      runCompare();
    } else if (action === 'Gift Finder' || action === 'Find Gifts') {
      startWizard();
    } else {
      handleSendMessage(action);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // ── WIZARD ─────────────────────────────────────────────────────────────────
  if (wizardOpen) {
    const step = WIZARD_STEPS[wizardStep];
    return (
      <LuxuryBackground isDark={isDark}>
        <div className="pt-24 pb-16 font-jakarta text-gray-900 dark:text-white flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl px-6">
          <div className="flex justify-between items-center mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm mb-3 text-[9px] font-bold tracking-[0.2em] uppercase" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                <Sparkles size={10} /> Gift Concierge
              </div>
              <h2 className="font-playfair text-3xl text-gray-900 dark:text-white">Step {wizardStep + 1} of {WIZARD_STEPS.length}</h2>
            </div>
            <button onClick={() => setWizardOpen(false)} className="text-gray-600 hover:text-gray-600 dark:text-gray-300 flex items-center gap-1.5 text-[10px] uppercase tracking-widest transition-colors">
              <X size={12} /> Close
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mb-10">
            {WIZARD_STEPS.map((s, i) => (
              <div key={i} className="flex-1">
                <div className={`h-0.5 rounded-full mb-1.5 transition-all ${i <= wizardStep ? 'bg-[#D4AF37]' : 'bg-[#222]'}`} />
                <p className={`text-[8px] uppercase tracking-widest ${i === wizardStep ? 'text-[#D4AF37]' : 'text-gray-600'}`}>{s.id}</p>
              </div>
            ))}
          </div>

          <motion.h1 key={wizardStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="font-playfair text-3xl md:text-5xl text-gray-900 dark:text-white mb-10">
            {step.title}
          </motion.h1>

          <div className="grid grid-cols-2 gap-3">
            {step.options.map((opt, i) => (
              <motion.button key={opt} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }} onClick={() => handleWizardSelection(opt)}
                className="p-5 bg-white dark:bg-[#0B0B0B] border border-gray-200 dark:border-[#1A1A1A] hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 text-left rounded-xl group transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:text-white transition-colors">{opt}</span>
                  <ArrowRight size={16} className="text-[#D4AF37] opacity-0 group-hover:opacity-100 transform -translate-x-1 group-hover:translate-x-0 transition-all" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        </div>
      </LuxuryBackground>
    );
  }

  // ── HOME EXPERIENCE ────────────────────────────────────────────────────────
  if (messages.length === 1) {
    return (
      <LuxuryBackground isDark={isDark}>
        <div className="pt-24 pb-16 font-jakarta text-gray-900 dark:text-white container-app flex flex-col items-center">
          {/* Hero */}
          <div className="text-center mb-14 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-6 text-[9px] font-bold tracking-[0.22em] uppercase"
              style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Sparkles size={10} />
              {aiHealth.available ? `NexORA Intelligence · ${aiHealth.model}` : 'NexORA Intelligence'}
            </div>
            <h1 className="font-playfair text-4xl md:text-6xl lg:text-7xl mb-5 leading-[1.1]">
              Welcome to NexORA.<br />
              <span className="text-[#D4AF37]">What are you shopping for today?</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-400 dark:text-gray-400 text-[15px] max-w-lg mx-auto leading-relaxed">
              Your personal luxury advisor. Tell me what you need and I'll curate a selection that matches your style, preferences, and budget.
            </p>
          </div>

          {/* Search Input */}
          <div className="mb-14 w-full max-w-2xl relative">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={aiHealth.available ? 'Tell me what you\'re looking for…' : 'Concierge is temporarily unavailable…'}
              disabled={!aiHealth.available}
              className="w-full bg-white dark:bg-[#0B0B0B] border border-gray-200 dark:border-[#1A1A1A] focus:border-[#D4AF37]/50 rounded-full py-4 pl-7 pr-16 text-gray-900 dark:text-white outline-none transition-all shadow-[0_0_40px_rgba(212,175,55,0.06)] disabled:opacity-40 text-[15px]" />
            <button onClick={() => handleSendMessage()} disabled={!input.trim() || !aiHealth.available}
              className="absolute right-2 top-2 bottom-2 px-4 bg-[#D4AF37] rounded-full flex items-center justify-center text-black hover:bg-white transition-colors disabled:bg-[#333] disabled:text-gray-500 dark:text-gray-400 dark:text-gray-400">
              <Send size={15} />
            </button>
            {!aiHealth.available && (
              <p className="text-center text-[10px] text-red-400/70 mt-2 tracking-widest uppercase">
                Our concierge is currently assisting other clients. Please try again shortly.
              </p>
            )}
          </div>

          {/* Discovery Cards */}
          <div className="flex flex-wrap justify-center gap-4 w-full max-w-5xl mb-20">
            {HOME_CATEGORIES.map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => cat.action === 'WIZARD' ? startWizard() : handleSendMessage(cat.prompt)}
                className={`relative cursor-pointer w-56 h-64 rounded-xl overflow-hidden border border-gray-200 dark:border-[#1A1A1A] hover:border-[#D4AF37]/50 transition-all duration-500 group bg-gradient-to-b ${cat.gradient}`}>
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 dark:from-black dark:via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-5">
                  <h3 className="font-playfair text-[17px] text-gray-900 dark:text-white group-hover:text-[#D4AF37] transition-colors leading-tight mb-2">{cat.title}</h3>
                  <div className="flex items-center gap-1.5 text-[#D4AF37] text-[9px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                    {cat.action === 'WIZARD' ? 'Begin' : 'Explore'} <ChevronRight size={11} />
                  </div>
                </div>
                {cat.action === 'WIZARD' && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center">
                    <Sparkles size={10} className="text-[#D4AF37]" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Pre-Chat Product Rows */}
          <div className="w-full max-w-6xl">
            <DiscoveryRow title="Recommended Today"   products={preChatRecs.recommendedToday} />
            <DiscoveryRow title="CEO Picks"           products={preChatRecs.ceoPicks} />
            <DiscoveryRow title="Trending Luxury"     products={preChatRecs.trendingLuxury} />
            <DiscoveryRow title="Luxury Gifts"        products={preChatRecs.giftFinder} />
            <DiscoveryRow title="Executive Essentials" products={preChatRecs.executiveEssentials} />
            <DiscoveryRow title="New Arrivals"        products={preChatRecs.newArrivals} />
          </div>
        </div>
      </LuxuryBackground>
    );
  }

  // ── CHAT EXPERIENCE ────────────────────────────────────────────────────────
  return (
    <LuxuryBackground isDark={isDark}>
      <div className="pt-24 pb-6 font-jakarta text-gray-900 dark:text-white container-app max-w-5xl mx-auto flex flex-col min-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-gray-200 dark:border-[#1A1A1A] mb-2">
          <div>
            <h1 className="font-playfair text-2xl text-gray-900 dark:text-white">Private Concierge</h1>
            <p className="text-[9px] tracking-widest uppercase mt-1.5 flex items-center gap-2">
              {aiHealth.available ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                  <span className="text-[#D4AF37]">Live · {aiHealth.model}</span></>
              ) : (
                <><span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-red-400">Offline · High Demand</span></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={resetSession} className="text-[9px] uppercase tracking-widest text-gray-600 hover:text-[#D4AF37] dark:text-gray-400 transition-colors">
              Clear Memory
            </button>
            <button onClick={() => exportMemory('json')} className="text-[9px] uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-[#D4AF37] transition-colors flex items-center gap-1">
              <Download size={11} /> Export JSON
            </button>
            <button onClick={() => exportMemory('markdown')} className="text-[9px] uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-[#D4AF37] transition-colors flex items-center gap-1">
              <Download size={11} /> Export MD
            </button>
            <button onClick={forgetMe} className="text-[9px] uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1">
              <Trash2 size={11} /> Forget Me
            </button>
            <button onClick={endSession} className="text-[9px] uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors flex items-center gap-1">
              End Session
            </button>
          </div>
        </div>

        {/* V10 — Luxury Journey Stage Bar */}
        <div className="flex items-center gap-0 py-2.5 border-b border-gray-200 dark:border-[#111] mb-2 overflow-x-auto scrollbar-hide">
          {JOURNEY_STAGES.map((stage, i) => {
            const stageIdx   = JOURNEY_STAGES.findIndex(s => s.id === journeyStage);
            const thisIdx    = i;
            const isActive   = stage.id === journeyStage;
            const isPast     = thisIdx < stageIdx;
            const Icon       = stage.icon;
            return (
              <div key={stage.id} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
                  isActive ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' :
                  isPast   ? 'text-[#D4AF37]/40' : 'text-gray-400 dark:text-gray-600'
                }`}>
                  <Icon size={9} />
                  {stage.label}
                </div>
                {i < JOURNEY_STAGES.length - 1 && (
                  <div className={`w-5 h-px ${ isPast || isActive ? 'bg-[#D4AF37]/40' : 'bg-gray-200 dark:bg-[#222]'}`} />
                )}
              </div>
            );
          })}
          {activeSkill && (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-400 text-[8px] uppercase tracking-widest font-bold whitespace-nowrap">
              <Sparkles size={8} /> {activeSkill.replace(/-/g, ' ')}
            </div>
          )}
        </div>


        {/* Memory Chips */}
        {visibleMemoryKeys.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200 dark:border-[#111] mb-4">
            {visibleMemoryKeys.map(([k, v]) => (
              <MemoryChip key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}
                value={k === 'budget' ? `₹${Number(v).toLocaleString('en-IN')}` : v}
                onRemove={() => removeMemoryKey(k)} />
            ))}
          </div>
        )}

        {/* Chat Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">

                {/* Message bubble */}
                {m.text && (
                  <div className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {m.role === 'assistant' && (
                      <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] font-playfair font-bold text-sm">N</div>
                    )}
                    <div className="max-w-[78%]">
                      {/* V10: Skill badge on assistant messages */}
                      {m.role === 'assistant' && m.skill && (
                        <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-400 text-[7px] uppercase tracking-widest font-bold">
                          <Sparkles size={7} /> {m.skill.replace(/-/g, ' ')}
                        </div>
                      )}
                      <p className={`text-[14px] leading-relaxed px-5 py-3.5 ${m.role === 'user'
                        ? 'bg-gradient-to-br from-[#D4AF37] to-[#B38945] text-black rounded-[20px_4px_20px_20px] shadow-lg shadow-[#D4AF37]/20'
                        : 'backdrop-blur-md bg-white/60 dark:bg-[#111]/60 shadow-lg border border-white/20 dark:border-[#1A1A1A] text-gray-800 dark:text-gray-100 rounded-[4px_20px_20px_20px]'}`}>
                        {m.text || <span className="animate-pulse text-[#D4AF37] text-[12px] font-semibold tracking-wider uppercase">Curating...</span>}
                      </p>
                      {/* Intent loading indicator */}
                      {intentLoading && i === messages.length - 1 && m.role === 'user' && (
                        <p className="text-[9px] text-gray-600 mt-1 ml-1 uppercase tracking-widest flex items-center gap-1">
                          <Zap size={8} className="text-[#D4AF37]" /> Reading preferences…
                        </p>
                      )}
                      {/* Retry button for capacity / quota messages */}
                      {m.role === 'assistant' && i > 0 && i === messages.length - 1 && !loading &&
                        (m.text?.includes('peak capacity') || m.text?.includes('[Ref:') || m.text?.includes('try again')) && (
                        <button
                          onClick={() => {
                            // Resend the last user message
                            const lastUser = [...messages].reverse().find(x => x.role === 'user');
                            if (lastUser) handleSendMessage(lastUser.text);
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all border"
                          style={{ borderColor: 'rgba(212,175,55,0.4)', color: '#D4AF37', background: 'rgba(212,175,55,0.08)' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(212,175,55,0.18)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(212,175,55,0.08)'; }}
                        >
                          <RotateCcw size={10} /> Retry
                        </button>
                      )}
                    </div>

                  </div>
                )}

                {/* Product cards (horizontal scroll) */}
                {m.products?.length > 0 && (
                  <div className="ml-12 flex overflow-x-auto gap-3 snap-x scrollbar-hide py-1">
                    {m.products.map(p => (
                      <ProductCard key={p._id} p={p} reasons={m.reasons}
                        onAddCart={addToCart}
                        onToggleWishlist={toggleWishlist}
                        isWishlisted={isInWishlist(p._id)}
                        onCompare={handleToggleCompare}
                        inCompare={compareProducts.some(cp => cp._id === p._id)} />
                    ))}
                  </div>
                )}

                {/* Action chips */}
                {m.actions?.length > 0 && (
                  <div className="ml-12 flex flex-wrap gap-2 mt-1">
                    {m.actions.map((action, idx) => (
                      <button key={idx} onClick={() => handleAction(action)}
                        className="px-3.5 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] text-[10px] font-semibold tracking-wide hover:bg-[#D4AF37] hover:text-black transition-all">
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Compare Table (inline after messages) */}
            {compareData && <CompareTable data={compareData} onClose={() => setCompareData(null)} />}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] font-playfair font-bold text-sm">N</div>
                <div className="bg-gray-100 dark:bg-[#111] px-5 py-4 rounded-[4px_20px_20px_20px] border border-gray-200 dark:border-[#1A1A1A] flex gap-1.5 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Compare Sticky Bar */}
        <AnimatePresence>
          {compareProducts.length >= 2 && !compareData && (
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-white dark:bg-[#0B0B0B] border border-[#D4AF37]/40 rounded-full shadow-[0_0_40px_rgba(212,175,55,0.2)] backdrop-blur-xl">
              <GitCompare size={14} className="text-[#D4AF37]" />
              <span className="text-[11px] text-gray-900 dark:text-white font-medium">{compareProducts.length} selected</span>
              <div className="flex gap-1.5">
                {compareProducts.map(p => (
                  <div key={p._id} className="flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-[9px] text-[#D4AF37]">
                    {p.name.slice(0, 14)}…
                    <button onClick={() => handleToggleCompare(p)}><X size={8} /></button>
                  </div>
                ))}
              </div>
              <button onClick={runCompare} disabled={compareLoading}
                className="px-4 py-1.5 bg-[#D4AF37] text-black text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-white transition-colors disabled:opacity-50">
                {compareLoading ? '…' : 'Compare Now'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="pt-4 border-t border-gray-200 dark:border-[#1A1A1A] sticky bottom-0 bg-[#FFFDF8]/90 dark:bg-[#050505]/90 backdrop-blur-md">
          <div className="relative">
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
              disabled={!aiHealth.available} rows={1}
              placeholder={aiHealth.available ? 'Ask for recommendations, comparisons, or styling advice…' : 'Concierge is currently unavailable…'}
              className="w-full bg-white dark:bg-[#0B0B0B] border border-gray-200 dark:border-[#1A1A1A] focus:border-[#D4AF37]/50 rounded-2xl py-4 pl-5 pr-16 text-gray-900 dark:text-white text-[14px] outline-none transition-all resize-none shadow-[0_-10px_40px_rgba(0,0,0,0.6)] disabled:opacity-40" />
            <button onClick={() => handleSendMessage()} disabled={!input.trim() || loading || !aiHealth.available}
              className="absolute right-3 top-3 bottom-3 w-9 bg-[#D4AF37] rounded-full flex items-center justify-center text-black hover:bg-white transition-colors disabled:opacity-30">
              <Send size={14} />
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-1">
            <div className="flex gap-1.5 flex-wrap">
              {visibleMemoryKeys.slice(0, 3).map(([k, v]) => (
                <span key={k} className="text-[9px] text-gray-600 flex items-center gap-1">
                  <Clock size={8} />
                  {k}: {k === 'budget' ? `₹${Number(v).toLocaleString('en-IN')}` : String(v)}
                </span>
              ))}
            </div>
            <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]/60">Powered by Gemini</p>
          </div>
        </div>
      </div>
    </LuxuryBackground>
  );
}
