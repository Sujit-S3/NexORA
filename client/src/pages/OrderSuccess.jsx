// NexORA V9 — Luxury Order Success & Ownership Hub

import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Package, Sparkles, Shield, Wrench, Star,
  MapPin, Clock, ChevronRight, MessageCircle, Heart
} from 'lucide-react';
import aiService from '@services/aiService';
import { formatPrice } from '../utils/formatPrice';
import { getLuxuryFallback } from '../utils/getLuxuryFallback';

const TIMELINE = [
  { label: 'Order Confirmed',  icon: Check,    done: true },
  { label: 'Being Dispatched', icon: Package,  done: false },
  { label: 'Out for Delivery', icon: MapPin,   done: false },
];

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId  = searchParams.get('orderId');
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState(false);
  const [postPurchase, setPostPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('care');

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const ob = new MutationObserver(sync);
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Fetch AI post-purchase package
    if (orderId) {
      aiService.getPostPurchase(orderId)
        .then(r => { if (r.data?.success) setPostPurchase(r.data.data); })
        .catch(() => setPostPurchase({ careText: 'Store your item in a cool, dry place away from direct sunlight.', estimatedDelivery: 'Within 5–7 business days', recommendations: [] }))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => { ob.disconnect(); };
  }, [orderId]);

  const BG   = isDark ? '#050505' : 'transparent';
  const SURF = isDark ? '#0B0B0B' : '#FFFFFF';
  const BORD = isDark ? '#1A1A1A' : '#E8E2D9';
  const TEXT = isDark ? '#FFFFFF' : '#111111';
  const SUB  = isDark ? '#9CA3AF' : '#6B7280';
  const ACC  = isDark ? '#D4AF37' : '#C9A96E';

  const hubTabs = [
    { id: 'care',     label: 'Care Guide',      icon: Heart },
    { id: 'warranty', label: 'Warranty',         icon: Shield },
    { id: 'service',  label: 'Service',          icon: Wrench },
    { id: 'track',    label: 'Track Order',      icon: MapPin },
    { id: 'concierge',label: 'Contact Concierge',icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen font-jakarta flex flex-col pt-28 pb-20 relative overflow-hidden" style={{ background: BG, color: TEXT }}>
      {/* Pure CSS confetti burst — no external lib */}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-60px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece {
          position: fixed; top: 0; width: 8px; height: 14px; border-radius: 2px;
          animation: confettiFall linear forwards; pointer-events: none; z-index: 999;
        }
        @keyframes orbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      {[...Array(30)].map((_, i) => (
        <div key={i} className="confetti-piece" style={{
          left: `${Math.random() * 100}%`,
          background: ['#D4AF37','#B38945','#FFF','#E8E2D9','#C9A96E'][i % 5],
          animationDuration: `${2 + Math.random() * 3}s`,
          animationDelay:    `${Math.random() * 2}s`,
          opacity: 0,
        }} />
      ))}

      <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 20%, ${isDark ? 'rgba(212,175,55,0.07)' : 'rgba(201,169,110,0.09)'} 0%, transparent 60%)` }} />

      <div className="container-app relative z-10 flex-1 flex flex-col items-center">

        {/* ── SUCCESS HEADER ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center max-w-2xl mx-auto mb-16">

          {/* Animated Check */}
          <div className="w-28 h-28 mx-auto mb-10 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/40" style={{ animation: 'orbSpin 10s linear infinite' }} />
            <div className="absolute inset-2 rounded-full border border-[#D4AF37]/20" style={{ animation: 'orbSpin 7s linear infinite reverse' }} />
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(212,175,55,0.25)]" style={{ background: 'linear-gradient(135deg, #D4AF37, #B38945)' }}>
              <Check size={30} color="#000" strokeWidth={3} />
            </div>
          </div>

          <p className="text-[9px] font-bold tracking-[0.32em] uppercase mb-5" style={{ color: ACC }}>Order Confirmed</p>
          <h1 className="font-playfair text-4xl lg:text-6xl mb-5 leading-tight">Thank you for your purchase.</h1>
          <p className="text-[14px] leading-relaxed max-w-md mx-auto mb-10" style={{ color: SUB }}>
            Your luxury order is being prepared with our complimentary signature packaging and will be dispatched shortly.
          </p>

          {/* Order Number */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-0 p-2 rounded-lg mb-10" style={{ background: SURF, border: `1px solid ${BORD}` }}>
            <span className="px-5 py-2 text-[11px] font-medium" style={{ color: SUB }}>Order Reference</span>
            <span className="px-5 py-2 text-[12px] font-mono tracking-[0.2em] font-bold rounded" style={{ background: isDark ? '#111' : '#F2EDE4' }}>
              #{orderId || 'NXR-PENDING'}
            </span>
          </div>

          {/* Delivery Timeline */}
          <div className="flex items-center justify-center gap-0 mb-10">
            {TIMELINE.map((step, i) => (
              <div key={i} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${step.done ? 'border-[#D4AF37] bg-[#D4AF37]/15' : 'border-gray-700 bg-transparent'}`}>
                    <step.icon size={14} style={{ color: step.done ? ACC : SUB }} />
                  </div>
                  <p className="text-[9px] uppercase tracking-widest mt-1.5 w-20 text-center" style={{ color: step.done ? ACC : SUB }}>{step.label}</p>
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className="w-16 h-px mx-1 mb-5" style={{ background: isDark ? '#222' : '#DDD' }} />
                )}
              </div>
            ))}
          </div>

          {postPurchase?.estimatedDelivery && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10" style={{ background: isDark ? '#111' : '#F5F0E8', border: `1px solid ${BORD}` }}>
              <Clock size={12} style={{ color: ACC }} />
              <span className="text-[11px]" style={{ color: TEXT }}>
                Estimated Delivery: <strong>{postPurchase.estimatedDelivery}</strong>
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3">
            <button onClick={() => navigate('/orders')} className="px-7 py-3.5 text-[10px] font-bold tracking-widest uppercase transition-colors" style={{ background: ACC, color: '#000', borderRadius: 4 }}>
              Track Order
            </button>
            <button onClick={() => navigate('/products')} className="px-7 py-3.5 text-[10px] font-bold tracking-widest uppercase transition-colors" style={{ background: 'transparent', border: `1px solid ${BORD}`, color: TEXT, borderRadius: 4 }}>
              Continue Shopping
            </button>
          </div>
        </motion.div>

        {/* ── LUXURY OWNERSHIP HUB ────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}
          className="w-full max-w-3xl mx-auto mb-20 rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORD}`, background: SURF }}>

          {/* Hub Header */}
          <div className="px-8 py-6 flex items-center gap-3 border-b" style={{ borderColor: BORD }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `rgba(212,175,55,0.15)` }}>
              <Sparkles size={14} style={{ color: ACC }} />
            </div>
            <div>
              <h2 className="font-playfair text-xl">Luxury Ownership Hub</h2>
              <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: SUB }}>Everything you need for your new purchase</p>
            </div>
          </div>

          {/* Tab Nav */}
          <div className="flex border-b overflow-x-auto" style={{ borderColor: BORD }}>
            {hubTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-transparent text-gray-500 hover:text-white'
                }`}>
                <tab.icon size={12} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'care' && (
                <motion.div key="care" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h3 className="font-playfair text-lg mb-4">Care Instructions</h3>
                  {loading ? (
                    <div className="h-20 rounded-lg animate-pulse" style={{ background: isDark ? '#111' : '#eee' }} />
                  ) : (
                    <p className="text-[14px] leading-relaxed" style={{ color: SUB }}>
                      {postPurchase?.careText || 'Store your item in a cool, dry place away from direct sunlight and humidity.'}
                    </p>
                  )}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    {[{ label: 'Avoid Humidity', icon: '💧' }, { label: 'Keep Cool', icon: '❄️' }, { label: 'Store Properly', icon: '📦' }].map(tip => (
                      <div key={tip.label} className="text-center p-4 rounded-xl" style={{ border: `1px solid ${BORD}` }}>
                        <div className="text-2xl mb-2">{tip.icon}</div>
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: SUB }}>{tip.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {activeTab === 'warranty' && (
                <motion.div key="warranty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h3 className="font-playfair text-lg mb-4">Warranty & Authenticity</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-5 rounded-xl" style={{ border: `1px solid ${BORD}` }}>
                      <Shield size={20} style={{ color: ACC }} />
                      <div>
                        <p className="font-semibold text-[13px] mb-1">NexORA Authenticity Guarantee</p>
                        <p className="text-[12px]" style={{ color: SUB }}>All products are 100% authentic and verified. Your certificate of authenticity will be included in your package.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-5 rounded-xl" style={{ border: `1px solid ${BORD}` }}>
                      <Check size={20} style={{ color: ACC }} />
                      <div>
                        <p className="font-semibold text-[13px] mb-1">12-Month Manufacturer Warranty</p>
                        <p className="text-[12px]" style={{ color: SUB }}>Covers manufacturing defects. Register your product within 30 days of purchase to activate.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'service' && (
                <motion.div key="service" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h3 className="font-playfair text-lg mb-4">Service Schedule</h3>
                  <div className="space-y-3">
                    {[
                      { period: '30 Days', action: 'Initial wear assessment & adjustment' },
                      { period: '6 Months', action: 'Complimentary cleaning & polish' },
                      { period: '12 Months', action: 'Full manufacturer service check' },
                      { period: '3–5 Years', action: 'Professional overhaul (brand recommended)' },
                    ].map(item => (
                      <div key={item.period} className="flex items-center gap-4 p-4 rounded-lg" style={{ border: `1px solid ${BORD}` }}>
                        <span className="text-[10px] font-bold uppercase tracking-widest w-20 shrink-0" style={{ color: ACC }}>{item.period}</span>
                        <span className="text-[12px]" style={{ color: SUB }}>{item.action}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {activeTab === 'track' && (
                <motion.div key="track" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h3 className="font-playfair text-lg mb-4">Order Tracking</h3>
                  <p className="text-[14px] mb-6" style={{ color: SUB }}>
                    Your order <strong style={{ color: TEXT }}>#{orderId || 'pending'}</strong> is confirmed and being prepared for dispatch.
                  </p>
                  <button onClick={() => navigate('/orders')} className="flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ background: ACC, color: '#000', borderRadius: 4 }}>
                    View Full Tracking <ChevronRight size={14} />
                  </button>
                </motion.div>
              )}
              {activeTab === 'concierge' && (
                <motion.div key="concierge" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h3 className="font-playfair text-lg mb-4">Your Personal Concierge</h3>
                  <p className="text-[14px] mb-6" style={{ color: SUB }}>
                    Have questions about your order, care, or styling? Your personal concierge is available.
                  </p>
                  <div className="flex gap-3">
                    <Link to="/concierge" className="flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ background: ACC, color: '#000', borderRadius: 4 }}>
                      <Sparkles size={13} /> Open Concierge
                    </Link>
                    <Link to="/contact" className="flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors" style={{ background: 'transparent', border: `1px solid ${BORD}`, color: TEXT, borderRadius: 4 }}>
                      Contact Support
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── CONCIERGE RECOMMENDATIONS ────────────────────────────────────── */}
        {!loading && postPurchase?.recommendations?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0, duration: 0.8 }}
            className="w-full max-w-5xl mx-auto border-t pt-16" style={{ borderColor: BORD }}>

            <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[8px] font-bold tracking-[0.22em] uppercase mb-4"
                  style={{ background: `rgba(212,175,55,0.1)`, color: ACC, border: `1px solid rgba(212,175,55,0.2)` }}>
                  <Sparkles size={9} /> Your Concierge Recommends
                </div>
                <h2 className="font-playfair text-3xl">Complete Your Collection</h2>
              </div>
              <p className="text-[12px] max-w-xs text-right" style={{ color: SUB }}>
                Pieces selected to complement your recent purchase.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {postPurchase.recommendations.map(r => (
                <Link key={r._id} to={`/product/${r.slug}`}
                  className="group flex flex-col rounded-2xl overflow-hidden transition-transform hover:-translate-y-1.5"
                  style={{ background: SURF, border: `1px solid ${BORD}` }}>
                  <div className="h-[220px] flex items-center justify-center p-6" style={{ background: isDark ? '#111' : '#F2EDE4' }}>
                    <img src={r.images?.[0]?.url} alt={r.name}
                      className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-lighten group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.currentTarget.src = getLuxuryFallback(r.category?.name); }} />
                  </div>
                  <div className="p-5">
                    <p className="text-[8px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: SUB }}>{r.brand}</p>
                    <h3 className="font-playfair text-[16px] truncate mb-1 group-hover:text-[#D4AF37] transition-colors">{r.name}</h3>
                    {r.reasonBadge && (
                      <p className="text-[9px] mb-2" style={{ color: ACC }}>{r.reasonBadge}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium">{formatPrice(r.discountPrice || r.price)}</span>
                      <div className="flex items-center gap-1 text-[10px]" style={{ color: SUB }}>
                        <Star size={10} className="fill-[#D4AF37] text-[#D4AF37]" />
                        {r.ratings?.average?.toFixed(1) || '5.0'}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <style>{`@keyframes orbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
