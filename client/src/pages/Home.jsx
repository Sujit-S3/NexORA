// NexORA V7 — Luxury Commerce Homepage (AI Personalized)

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Package, ShieldCheck, Headphones, Gift, ArrowRight, Sparkles, Play } from 'lucide-react';
import MainLogo from '../components/common/MainLogo';
import api from '../services/api';

import { formatPrice } from '../utils/formatPrice';
import { getSessionId } from '../hooks/usePreferenceTracking';
import { getLuxuryFallback } from '../utils/getLuxuryFallback';
import SEO from '../components/common/SEO';

/* ─── STATIC DATA ─────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'fashion',      name: 'Fashion',      img: '/assets/luxury/fashion/gucci_jacket.png' },
  { id: 'watches',      name: 'Watches',      img: '/assets/luxury/watches/rolex_daytona.png' },
  { id: 'electronics',  name: 'Electronics',  img: '/assets/luxury/electronics/macbook_pro.png' },
  { id: 'accessories',  name: 'Accessories',  img: '/assets/luxury/bags/hermes_kelly.png' },
  { id: 'lifestyle',    name: 'Lifestyle',    img: '/assets/luxury/lifestyle/luxury_interior.png' },
  { id: 'luxury-gifts', name: 'Luxury Gifts', img: '/assets/luxury/lifestyle/executive_office.png' },
];

const BENEFITS = [
  { Icon: Package,    title: 'Free Shipping',    desc: 'Worldwide' },
  { Icon: ShieldCheck, title: 'Secure Payment',  desc: '100% Safe' },
  { Icon: Headphones, title: 'Premium Support',  desc: '24/7 Concierge' },
  { Icon: Gift,       title: 'Luxury Packaging', desc: 'Signature Experience' },
];

const TESTIMONIALS = [
  { name: 'James Anderson',   rating: 5, text: '"NexORA is more than a store. It\'s a luxury experience curated for those who expect the finest."' },
  { name: 'Priya Malhotra',   rating: 5, text: '"The AI Concierge helped me find the perfect anniversary gift. Impeccable service and delivery."' },
  { name: 'Alexander Reeves', rating: 5, text: '"An extraordinary platform. Nothing compares to the NexORA curation and presentation."' },
];

/* ─── ORBS ─────────────────────────────────────────────────── */
const NOrb = ({ size = 100, isDark }) => (
  <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
    <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)', animation: 'goldPulse 3s ease-in-out infinite' }} />
    <div className="absolute rounded-full border border-[#D4AF37]/45" style={{ inset: -8, animation: 'orbSpin 8s linear infinite' }} />
    <div className="absolute rounded-full border-[0.5px] border-[#D4AF37]/20" style={{ inset: -18, animation: 'orbSpin 14s linear infinite reverse' }} />
    <div
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: size * 0.72, height: size * 0.72,
        background: isDark 
          ? 'linear-gradient(145deg, rgba(212,175,55,0.15) 0%, rgba(5,5,5,0.92) 100%)'
          : 'linear-gradient(145deg, rgba(40,25,10,0.85) 0%, rgba(10,5,0,0.95) 100%)',
        border: isDark ? '1.5px solid rgba(212,175,55,0.6)' : '1.5px solid rgba(139,90,43,0.8)',
        backdropFilter: 'blur(14px)',
        boxShadow: isDark ? '0 0 35px rgba(212,175,55,0.22)' : '0 10px 30px rgba(0,0,0,0.25)',
      }}
    >
      <MainLogo className="w-1/2 h-1/2 relative z-10" showText={false} forceDarkMode={!isDark} />
    </div>
  </div>
);

/* ─── DYNAMIC ROW COMPONENTS ───────────────────────────────── */
const DynamicProductRow = ({ title, products, isDark, SURF, CARD, BORD, TEXT, SUB }) => {
  const [carIdx, setCarIdx] = useState(0);
  
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12" style={{ background: isDark ? '#050505' : 'transparent' }}>
      <div className="container-app">
        {/* Title */}
        <div className="flex items-center gap-4 justify-center mb-8">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4))' }} />
          <span className="text-[10px] font-semibold tracking-[0.3em] uppercase" style={{ color: SUB }}>{title}</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.4))' }} />
        </div>

        <div className="flex items-center gap-4">
          {/* Prev */}
          <button
            onClick={() => setCarIdx(i => Math.max(0, i - 1))}
            className="shrink-0 w-9 h-9 flex items-center justify-center transition-colors"
            style={{ border: `1px solid ${BORD}`, background: 'transparent', color: TEXT, borderRadius: 2 }}
          >
            <ChevronLeft size={15} />
          </button>

          {/* Cards */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-hidden">
            {products.slice(carIdx, carIdx + 5).map((p, i) => (
              <Link
                key={p?._id || i}
                to={p ? `/product/${p.slug}` : '#'}
                className="group relative flex flex-col overflow-hidden p-4 transition-all"
                style={{ background: CARD, border: `1px solid ${BORD}`, borderRadius: 4 }}
              >
                {/* Confidence Badge */}
                {p?.matchScore > 50 && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/80 backdrop-blur border border-[#D4AF37]/30 text-[#D4AF37] text-[8px] uppercase tracking-widest font-bold rounded">
                    {p.matchScore}% Match
                  </div>
                )}
                
                <div className="h-32 mb-3 relative flex items-center justify-center">
                  <img loading="lazy"
                    src={p.images?.[0]?.url || '/assets/placeholders/luxury-placeholder.jpg'} alt={p.name}
                    className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
                    style={{ mixBlendMode: isDark ? 'lighten' : 'multiply' }}
                   onError={(e) => {
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }} />
                </div>
                
                <h4 className="font-playfair font-semibold truncate text-[14px] mb-1" style={{ color: TEXT }}>{p.name}</h4>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-1" style={{ color: SUB }}>{p.brand}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[12px] font-medium" style={{ color: TEXT }}>{formatPrice(p.discountPrice || p.price)}</span>
                  <span className="flex items-center gap-1 text-[10px]" style={{ color: SUB }}><Star size={10} className="text-[#D4AF37] fill-[#D4AF37]"/> {p.ratings?.average || 5.0}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Next */}
          <button
            onClick={() => setCarIdx(i => Math.min(Math.max(0, products.length - 5), i + 1))}
            className="shrink-0 w-9 h-9 flex items-center justify-center transition-colors"
            style={{ border: `1px solid ${BORD}`, background: 'transparent', color: TEXT, borderRadius: 2 }}
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

const HERO_WATCHES = [
  '/assets/luxury/watches/rolex.png',
  '/assets/luxury/watches/ap.png',
  '/assets/luxury/watches/patek.png',
];
const HERO_BAGS_LIGHT = [
  '/assets/luxury/bags/hermes.png',
  '/assets/luxury/bags/chanel.png',
  '/assets/luxury/bags/dior.png',
];

/* ═══════════════════════════════════════════════════════════════
   HOME
═══════════════════════════════════════════════════════════════ */
export default function Home() {
  const navigate = useNavigate();
  const [isDark, setIsDark]       = useState(false);
  const [tIdx, setTIdx]           = useState(0);
  const [heroIdx, setHeroIdx]     = useState(0);
  const [heroPrev, setHeroPrev]   = useState(null);
  const [heroFading, setHeroFading] = useState(false);
  const containerRef = useRef(null);

  const [recs, setRecs] = useState({
    recommendedForYou: [],
    continueExploring: [],
    executivePicks: [],
    trendingLuxury: [],
    newArrivals: [],
    luxuryGifts: []
  });

  useEffect(() => {
    const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';
    if (!isPreview && localStorage.getItem('nexora_intro_seen') !== 'true') {
      navigate('/get-started', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const ob = new MutationObserver(sync);
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => ob.disconnect();
  }, []);

  // Hero image cross-fade — rotates every 4s
  useEffect(() => {
    const pool = isDark ? HERO_WATCHES : HERO_BAGS_LIGHT;
    const t = setInterval(() => {
      setHeroPrev(heroIdx);
      setHeroFading(true);
      setTimeout(() => {
        setHeroIdx(i => (i + 1) % pool.length);
        setHeroFading(false);
        setHeroPrev(null);
      }, 700);
    }, 4000);
    return () => clearInterval(t);
   
  }, [isDark, heroIdx]);

  // Reset index when theme changes
  useEffect(() => {
    setHeroIdx(0);
    setHeroPrev(null);
    setHeroFading(false);
  }, [isDark]);


  useEffect(() => {
    const t = setInterval(() => setTIdx(i => (i + 1) % TESTIMONIALS.length), 5500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await api.get('/preferences/homepage', {
          headers: { 'x-session-id': getSessionId() }
        });
        if (res.data.success) {
          setRecs(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch personalized homepage", err);
      }
    };
    fetchRecommendations();
  }, []);

  const { scrollYProgress } = useScroll({ target: containerRef });
  const smoothY = useSpring(scrollYProgress, { stiffness: 60, damping: 22 });
  const productY = useTransform(smoothY, [0, 0.25], [0, -70]);

  const BG   = isDark ? '#050505' : 'transparent';
  const SURF = isDark ? '#0B0B0B' : 'rgba(255,255,255,0.6)';
  const CARD = isDark ? '#0B0B0B' : '#F2EDE4';
  const BORD = isDark ? '#1A1A1A' : '#E8E2D9';
  const TEXT = isDark ? '#FFFFFF' : '#111111';
  const SUB  = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <div ref={containerRef} className="overflow-x-hidden font-jakarta" style={{ background: BG, color: TEXT }}>
      <SEO 
        title="Luxury Shopping | Personalized AI Concierge" 
        description="Experience personalized luxury shopping at NexORA. Discover curated watches, designer bags, and premium gifts." 
      />

      {/* Global keyframes */}
      <style>{`
        @keyframes orbSpin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes goldPulse { 0%,100% { opacity:.3; transform:scale(1); } 50% { opacity:.6; transform:scale(1.06); } }
        @keyframes floatUD   { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-18px); } }
        @keyframes heroGlow  { 0%,100% { opacity:0.35; transform:scale(1) translateX(-50%); } 50% { opacity:0.65; transform:scale(1.08) translateX(-50%); } }
        @keyframes shimmer1  { 0%,100% { opacity:0; transform:translate(-50%,-50%) scale(0); } 40%,60% { opacity:1; transform:translate(-50%,-50%) scale(1); } }
        @keyframes shimmer2  { 0%,100% { opacity:0; transform:translate(-50%,-50%) scale(0) rotate(45deg); } 45%,55% { opacity:0.8; transform:translate(-50%,-50%) scale(1) rotate(45deg); } }
        .float-hero { animation: floatUD 6s ease-in-out infinite; }
        /* Hero image cross-fade */
        .hero-img-enter { animation: heroImgIn  0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        .hero-img-exit  { animation: heroImgOut 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes heroImgIn  { from { opacity:0; transform:scale(0.93) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes heroImgOut { from { opacity:1; transform:scale(1); }                    to { opacity:0; transform:scale(1.05); } }
        .hero-glow { animation: heroGlow 4s ease-in-out infinite; }
        .hero-shimmer-1 { position:absolute; width:8px; height:8px; border-radius:50%; background:radial-gradient(circle,#fff 10%,transparent 70%); box-shadow:0 0 8px 3px rgba(255,255,255,0.9); animation:shimmer1 6s ease-in-out 0s infinite; }
        .hero-shimmer-2 { position:absolute; width:5px; height:5px; border-radius:50%; background:radial-gradient(circle,#D4AF37 10%,transparent 70%); box-shadow:0 0 6px 2px rgba(212,175,55,0.9); animation:shimmer2 8s ease-in-out 2s infinite; }
        .hero-shimmer-3 { position:absolute; width:6px; height:6px; border-radius:50%; background:radial-gradient(circle,#fff 10%,transparent 70%); box-shadow:0 0 8px 3px rgba(255,255,255,0.8); animation:shimmer1 7s ease-in-out 4s infinite; }
      `}</style>

      {/* ══════════════════════════════
          1 · HERO
      ══════════════════════════════ */}
      <section className="relative h-screen min-h-[680px] flex items-center overflow-hidden">
        {/* Ambient radial */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: isDark
            ? 'radial-gradient(ellipse 55% 65% at 62% 50%, rgba(212,175,55,0.09) 0%, transparent 72%)'
            : 'radial-gradient(ellipse 55% 65% at 62% 50%, rgba(201,169,110,0.13) 0%, transparent 72%)',
        }} />

        <div className="container-app w-full flex flex-col lg:flex-row items-center justify-between gap-8 pt-20">

          {/* LEFT — Copy */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6 z-20 shrink-0 w-full lg:w-auto text-center lg:text-left items-center lg:items-start"
            style={{ maxWidth: 560 }}
          >
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase" style={{ color: '#D4AF37' }}>
              Curated Luxury
            </p>

            <h1
              className="font-playfair leading-[1.05] tracking-tight"
              style={{ fontSize: 'clamp(40px,5.5vw,84px)', fontWeight: 600, color: TEXT }}
            >
              Curated Luxury.<br />
              Powered by<br />
              Intelligence.
            </h1>

            <p className="text-[15px] font-light leading-[1.7] max-w-[400px]" style={{ color: SUB }}>
              Discover, compare, and acquire extraordinary luxury — guided by an AI that knows your taste.
            </p>

            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <button
                onClick={() => navigate('/products')}
                className="px-8 py-3.5 text-[11px] font-semibold tracking-widest uppercase transition-all duration-300 hover:opacity-90"
                style={{ background: isDark ? '#D4AF37' : '#C9A96E', color: '#000', borderRadius: 2 }}
              >
                Shop Collection
              </button>
              <button
                onClick={() => navigate('/concierge')}
                className="relative flex items-center gap-2 px-7 py-3.5 text-[11px] font-medium tracking-widest uppercase transition-all duration-300 overflow-hidden group"
                style={{
                  border: `1px solid rgba(212,175,55,0.35)`,
                  background: 'rgba(212,175,55,0.04)',
                  color: '#D4AF37',
                  borderRadius: 2,
                }}
              >
                <Sparkles size={11} className="group-hover:rotate-12 transition-transform" />
                Ask AI Concierge
                <span className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* AI trust bar */}
            <div className="flex items-center gap-3 mt-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <p className="text-[9px] uppercase tracking-[0.2em]" style={{ color: isDark ? 'rgba(212,175,55,0.5)' : 'rgba(180,140,60,0.7)' }}>
                AI-powered · Verified inventory · Real-time availability
              </p>
            </div>
          </motion.div>

          {/* CENTER — Floating Hero Product (single image, cross-fade) */}
          <div className="flex-1 relative hidden lg:flex items-center justify-center pointer-events-none" style={{ height: '72vh', maxHeight: 600 }}>
            <motion.div style={{ y: productY }} className="relative w-full h-full flex items-center justify-center">

              {/* Atmospheric glow beneath product */}
              <div style={{
                position: 'absolute',
                bottom: '8%', left: '50%',
                width: '65%', height: '35%',
                background: isDark
                  ? 'radial-gradient(ellipse 80% 60% at 50% 80%, rgba(212,175,55,0.28) 0%, rgba(212,175,55,0.08) 45%, transparent 75%)'
                  : 'radial-gradient(ellipse 80% 60% at 50% 80%, rgba(201,169,110,0.22) 0%, rgba(201,169,110,0.06) 45%, transparent 75%)',
                filter: 'blur(24px)',
                pointerEvents: 'none',
              }} className="hero-glow" />

              {/* Outer gold ring (static) */}
              <div className="absolute rounded-full" style={{
                width: '80%', paddingBottom: '80%',
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                border: '1.5px solid rgba(212,175,55,0.38)',
                boxShadow: '0 0 80px rgba(212,175,55,0.10), inset 0 0 40px rgba(212,175,55,0.04)',
              }} />
              {/* Inner gold ring */}
              <div className="absolute rounded-full" style={{
                width: '60%', paddingBottom: '60%',
                top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                border: '0.5px solid rgba(212,175,55,0.12)',
              }} />

              {/* Hero image — cross-fade between images one by one */}
              <div className="relative z-10 float-hero" style={{ width: '82%', height: '82%' }}>

                {/* Previous image fading out */}
                {heroPrev !== null && (
                  <img
                    key={`prev-${heroPrev}`}
                    src={(isDark ? HERO_WATCHES : HERO_BAGS_LIGHT)[heroPrev]}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain hero-img-exit"
                    style={{
                      filter: isDark
                        ? 'drop-shadow(0 8px 32px rgba(212,175,55,0.40)) brightness(1.05)'
                        : 'drop-shadow(0 8px 24px rgba(212,175,55,0.30)) brightness(0.97)',
                    }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}

                {/* Current image entering */}
                <img
                  key={`curr-${heroIdx}-${isDark}`}
                  loading="eager"
                  src={(isDark ? HERO_WATCHES : HERO_BAGS_LIGHT)[heroIdx]}
                  alt={isDark ? 'Luxury Watch Dark' : 'Luxury Handbag Light'}
                  className="absolute inset-0 w-full h-full object-contain hero-img-enter"
                  style={{
                    filter: isDark
                      ? 'drop-shadow(0 8px 32px rgba(212,175,55,0.40)) brightness(1.05)'
                      : 'drop-shadow(0 8px 24px rgba(212,175,55,0.30)) brightness(0.97)',
                  }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />

                {/* Dot indicator strip */}
                <div className="absolute flex gap-1.5 items-center" style={{
                  bottom: '-22px', left: '50%', transform: 'translateX(-50%)',
                }}>
                  {(isDark ? HERO_WATCHES : HERO_BAGS_LIGHT).map((_, i) => (
                    <div key={i} style={{
                      width: i === heroIdx ? 16 : 4,
                      height: 3,
                      borderRadius: 2,
                      background: i === heroIdx ? '#D4AF37' : 'rgba(212,175,55,0.25)',
                      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  ))}
                </div>
              </div>

            </motion.div>
          </div>

          {/* RIGHT — AI Concierge Orb */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.85, delay: 0.15 }}
            className="hidden lg:flex flex-col items-center gap-4 shrink-0 cursor-pointer"
            style={{ width: 160 }}
            onClick={() => navigate('/concierge')}
          >
            <NOrb size={108} isDark={isDark} />
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-center" style={{ color: isDark ? '#D4AF37' : '#8C682A' }}>
              AI Concierge
            </p>
            <p className="text-[11px] text-center leading-[1.5]" style={{ color: isDark ? SUB : '#5C4A3D', maxWidth: 130 }}>
              Your personal luxury shopping assistant
            </p>
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════
          2 · DYNAMIC AI RECOMMENDATIONS
      ══════════════════════════════ */}
      <div className="py-8">
        <DynamicProductRow title="Recommended For You" products={recs.recommendedForYou} isDark={isDark} SURF={SURF} CARD={CARD} BORD={BORD} TEXT={TEXT} SUB={SUB} />
        <DynamicProductRow title="Continue Exploring" products={recs.continueExploring} isDark={isDark} SURF={SURF} CARD={CARD} BORD={BORD} TEXT={TEXT} SUB={SUB} />
        <DynamicProductRow title="Executive Picks" products={recs.executivePicks} isDark={isDark} SURF={SURF} CARD={CARD} BORD={BORD} TEXT={TEXT} SUB={SUB} />
        <DynamicProductRow title="Trending Luxury" products={recs.trendingLuxury} isDark={isDark} SURF={SURF} CARD={CARD} BORD={BORD} TEXT={TEXT} SUB={SUB} />
        <DynamicProductRow title="New Arrivals" products={recs.newArrivals} isDark={isDark} SURF={SURF} CARD={CARD} BORD={BORD} TEXT={TEXT} SUB={SUB} />
        <DynamicProductRow title="Luxury Gifts" products={recs.luxuryGifts} isDark={isDark} SURF={SURF} CARD={CARD} BORD={BORD} TEXT={TEXT} SUB={SUB} />
      </div>

      {/* ══════════════════════════════
          3 · SHOP BY CATEGORY
      ══════════════════════════════ */}
      <section className="py-20" style={{ background: BG }}>
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="group relative overflow-hidden flex flex-col"
                style={{ height: 280, borderRadius: 4 }}
              >
                <img loading="lazy"
                  src={cat.img} alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                 onError={(e) => {
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }} />
                {/* Gradient overlay */}
                <div className="absolute inset-0 transition-opacity duration-500"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)' }} />
                {/* Text */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-white font-jakarta text-[13px] font-semibold tracking-wide mb-1">{cat.name}</h3>
                  <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: '#D4AF37' }}>
                    Explore Now <ArrowRight size={9} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          4 · AI CONCIERGE SECTION
      ══════════════════════════════ */}
      <section className="py-20" style={{ background: BG }}>
        <div className="container-app">
          <div
            className="relative overflow-hidden flex flex-col md:flex-row items-center"
            style={{
              minHeight: 420,
              background: '#0B0B0B',
              border: '1px solid #1A1A1A',
              borderRadius: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
            }}
          >
            {/* Ambient */}
            <div className="absolute pointer-events-none" style={{
              top: '-30%', left: '-5%', width: '55%', height: '160%',
              background: 'radial-gradient(ellipse, rgba(212,175,55,0.06) 0%, transparent 70%)',
            }} />

            {/* Left */}
            <div className="relative z-10 flex-1 p-10 md:p-16 lg:p-20">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm mb-7 text-[9px] font-bold tracking-[0.22em] uppercase"
                style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
              >
                <Sparkles size={10} /> NexORA Intelligence
              </div>
              <h2 className="font-playfair text-white mb-4 leading-[1.15]"
                style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 500 }}>
                AI Concierge
              </h2>
              <p className="text-[14px] leading-relaxed mb-9" style={{ color: '#9CA3AF', maxWidth: 400 }}>
                Discover, compare and find the perfect luxury items with the power of AI.
              </p>
              <button
                onClick={() => navigate('/concierge')}
                className="px-7 py-3.5 text-[10px] font-bold tracking-widest uppercase transition-all duration-300 hover:opacity-90"
                style={{ background: '#D4AF37', color: '#000', borderRadius: 2 }}
              >
                Chat with AI Concierge
              </button>
            </div>

            {/* Right — Big Orb */}
            <div className="relative z-10 flex items-center justify-center p-10 md:p-16 shrink-0">
              <NOrb size={200} />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          5 · BENEFITS STRIP
      ══════════════════════════════ */}
      <section style={{ background: SURF, borderTop: `1px solid ${BORD}`, borderBottom: `1px solid ${BORD}` }}>
        <div className="container-app">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {BENEFITS.map(({ Icon, title, desc }, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center py-10 px-6"
                style={{ borderRight: i < 3 ? `1px solid ${BORD}` : 'none' }}
              >
                <Icon size={26} strokeWidth={1.2} style={{ color: '#D4AF37', marginBottom: 14 }} />
                <h4 className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: TEXT }}>{title}</h4>
                <p className="text-[12px]" style={{ color: SUB }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          6 · TESTIMONIALS
      ══════════════════════════════ */}
      <section className="py-24" style={{ background: BG }}>
        <div className="container-app">
          <div className="flex items-center gap-4 justify-center mb-14">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4))' }} />
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase" style={{ color: SUB }}>Testimonials</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(212,175,55,0.4))' }} />
          </div>

          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={tIdx}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.55 }}
                className="text-center p-12 md:p-20"
                style={{
                  background: isDark ? '#0B0B0B' : '#FFFFFF',
                  border: `1px solid ${BORD}`,
                  borderRadius: 24,
                  boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 12px 50px rgba(0,0,0,0.07)',
                }}
              >
                <div className="flex justify-center gap-1 mb-8">
                  {Array(5).fill(0).map((_, i) => <Star key={i} size={14} fill="#D4AF37" style={{ color: '#D4AF37' }} />)}
                </div>
                <p className="font-playfair font-medium leading-relaxed mb-10"
                  style={{ fontSize: 'clamp(17px, 2.2vw, 24px)', color: TEXT }}>
                  {TESTIMONIALS[tIdx].text}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-px w-8" style={{ background: '#D4AF37' }} />
                  <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#D4AF37' }}>
                    {TESTIMONIALS[tIdx].name}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTIdx(i)}
                  className="rounded-full transition-all duration-400"
                  style={{ width: i === tIdx ? 22 : 6, height: 6, background: i === tIdx ? '#D4AF37' : (isDark ? '#2A2A2A' : '#D0CEC9') }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
