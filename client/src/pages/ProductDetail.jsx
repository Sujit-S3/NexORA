// NexORA V13 — Luxury Product Detail Experience

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Star, Shield, Truck, Package, RotateCcw, ChevronDown, ChevronUp, Sparkles, MessageSquare, Plus, Minus, ArrowRight, CheckCircle2, Activity, X, Zap, GitCompare, Award, Clock } from 'lucide-react';
import { productService } from '@services/productService';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import ProductReviews from '@components/product/ProductReviews';
import SizeSelector from '@components/product/SizeSelector';
import SizeGuideModal from '@components/product/SizeGuideModal';
import aiService from '@services/aiService';
import axios from 'axios';
import usePreferenceTracking, { getSessionId } from '../hooks/usePreferenceTracking';
import { getLuxuryFallback } from '../utils/getLuxuryFallback';
import { formatPrice } from '../utils/formatPrice';
import SEO from '../components/common/SEO';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const ob = new MutationObserver(sync);
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => ob.disconnect();
  }, []);

  const [product, setProduct] = useState(null);
  const [recs, setRecs] = useState({
    frequentlyBoughtTogether: [],
    premiumUpgrade: [],
    similarStyle: [],
    luxuryAlternatives: []
  });
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeSpec, setActiveSpec] = useState('materials');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const hasVariants = product?.variants && product.variants.length > 0;
  
  // Extract unique colors
  const uniqueColors = hasVariants ? Array.from(new Set(product.variants.filter(v => v.color).map(v => v.color))) : [];
  
  // When variants load or color is missing but exists, set default color
  useEffect(() => {
    if (uniqueColors.length > 0 && !selectedColor) {
      setSelectedColor(uniqueColors[0]);
    }
  }, [uniqueColors, selectedColor]);

  // Determine available variants based on color
  const filteredVariants = hasVariants && selectedColor 
    ? product.variants.filter(v => v.color === selectedColor) 
    : (product?.variants || []);

  const currentVariant = hasVariants ? product.variants.find(v => v.size === selectedSize && (selectedColor ? v.color === selectedColor : true)) : null;
  const availableStock = hasVariants 
    ? (selectedSize ? (currentVariant?.stock || 0) : product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)) 
    : product?.stock || 0;

  // Swappable Gallery
  const allImages = [
    ...(product?.primaryImage?.url ? [product.primaryImage] : []),
    ...(product?.images || [])
  ];
  // Remove duplicates based on URL
  const uniqueImages = allImages.filter((img, idx, self) => 
    idx === self.findIndex(i => i.url === img.url)
  );

  const displayImages = (selectedColor && currentVariant?.images?.length > 0) 
    ? currentVariant.images 
    : (uniqueImages.length > 0 ? uniqueImages : []);

  // AI States
  const [aiReviewSummary, setAiReviewSummary] = useState('');
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [conciergeHovered, setConciergeHovered] = useState(null);

  // V13: Navigate to concierge with product pre-loaded
  const openConcierge = useCallback((prompt) => {
    if (!product) return;
    // Store product context in sessionStorage so Concierge picks it up
    sessionStorage.setItem('nexora_concierge_prompt', prompt || `Tell me about the ${product.name} by ${product.brand}`);
    sessionStorage.setItem('nexora_concierge_product', JSON.stringify({
      _id: product._id, name: product.name, brand: product.brand,
      slug: product.slug, price: product.price, discountPrice: product.discountPrice,
      category: product.category, images: product.images,
    }));
    navigate('/concierge');
  }, [product, navigate]);

  // Preference Tracking
  usePreferenceTracking('view_product', { productId: product?._id, brand: product?.brand }, !!product);

  // Colors
  const BG   = isDark ? '#050505' : 'transparent';
  const SURF = isDark ? '#0B0B0B' : '#FFFFFF';
  const BORD = isDark ? '#1A1A1A' : '#E8E2D9';
  const TEXT = isDark ? '#FFFFFF' : '#111111';
  const SUB  = isDark ? '#9CA3AF' : '#6B7280';
  const ACC  = isDark ? '#D4AF37' : '#C9A96E';

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        window.scrollTo(0, 0);
        const { data } = await productService.getBySlug(slug);
        const p = data.data;
        setProduct(p);
        
        // Fetch Smart Recommendations
        if (p._id) {
          const res = await axios.get(`/api/preferences/pdp/${p._id}`, {
            headers: { 'x-session-id': getSessionId() }
          });
          if (res.data.success) {
            setRecs(res.data.data);
          }
        }

        // Fetch AI Review Summary
        if (p.numReviews > 0) {
          setAiReviewLoading(true);
          aiService.analyzeReviews(p._id).then(res => {
            setAiReviewSummary(res.data.data.summary);
            setAiReviewLoading(false);
          }).catch(() => {
            setAiReviewSummary('AI insights are temporarily unavailable.');
            setAiReviewLoading(false);
          });
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <div className="w-12 h-12 rounded-full border-2 border-transparent border-t-[#D4AF37] animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG, color: TEXT }}>
      <h2 className="font-playfair text-3xl">Product Not Found</h2>
    </div>
  );

  return (
    <div className="min-h-screen font-jakarta pb-20" style={{ background: BG, color: TEXT }}>
      <SEO 
        title={product.name} 
        description={product.description?.substring(0, 160)} 
        image={product.images?.[0]?.url}
      />
      {/* ══════════════════════════════
          1 · PRODUCT HERO
      ══════════════════════════════ */}
      <section className="container-app pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
          
          {/* LEFT: Gallery */}
          <div className="flex gap-6 h-fit lg:sticky lg:top-32">
            {/* Thumbnails */}
            <div className="hidden md:flex flex-col gap-4 w-20 shrink-0">
              {displayImages.map((img, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(i)}
                  className="w-20 h-24 rounded-lg overflow-hidden transition-all duration-300"
                  style={{ border: `2px solid ${activeImage === i ? ACC : 'transparent'}`, opacity: activeImage === i ? 1 : 0.5 }}
                >
                  <img loading="lazy" src={img.url} className="w-full h-full object-cover" alt=""  onError={(e) => {
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }} />
                </button>
              ))}
            </div>

            {/* Main Image */}
            <div 
              className="flex-1 rounded-[24px] overflow-hidden flex items-center justify-center p-10 relative group cursor-zoom-in"
              style={{ background: isDark ? '#111' : '#F2EDE4', border: `1px solid ${BORD}`, minHeight: 600 }}
            >
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  src={displayImages[activeImage]?.url || getLuxuryFallback(product?.category?.name || 'default')} 
                  alt={product.name}
                  className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-700 group-hover:scale-110"
                  style={{ mixBlendMode: isDark ? 'normal' : 'multiply' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getLuxuryFallback(product?.category?.name || 'default');
                  }}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT: Purchase Panel */}
          <div className="flex flex-col">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: ACC }}>
                {product.brand} {product.gender && product.gender !== 'Unisex' && `• ${product.gender}`}
              </p>
              <h1 className="font-playfair leading-[1.1] mb-6" style={{ fontSize: 'clamp(36px, 4vw, 56px)' }}>{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.floor(product.ratings?.average || 0) ? ACC : 'transparent'} style={{ color: ACC }} />
                  ))}
                </div>
                <span className="text-[13px] font-medium mt-0.5">{product.ratings?.average || 0} Average</span>
                <span style={{ color: BORD }}>|</span>
                <span className="text-[13px] hover:underline cursor-pointer" style={{ color: SUB }}>{product.ratings?.count || 0} Reviews</span>
              </div>

              <div className="flex items-end gap-4 mb-8">
                {product.discountPrice ? (
                  <div className="flex items-end gap-4 mb-8">
                    <span className="text-4xl lg:text-5xl font-medium tracking-tight" style={{ color: TEXT }}>{formatPrice(product.discountPrice)}</span>
                    <span className="text-xl line-through mb-1" style={{ color: SUB }}>{formatPrice(product.price)}</span>
                  </div>
                ) : (
                  <span className="text-4xl lg:text-5xl font-medium tracking-tight mb-8 block" style={{ color: TEXT }}>{formatPrice(product.price)}</span>
                )}
              </div>

              {product.stock > 0 && product.stock < 5 && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-bold tracking-wider uppercase mb-6" style={{ background: 'rgba(212,175,55,0.1)', color: ACC }}>
                  Only {product.stock} Left In Stock
                </div>
              )}
            </motion.div>

            {/* Controls */}
            <div className="p-8 rounded-[24px] shadow-2xl mb-10" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              {product.isActive && (hasVariants || product.stock > 0) ? (
                <>
                  {hasVariants && uniqueColors.length > 0 && (
                    <div className="mb-6">
                      <span className="text-[12px] font-bold tracking-widest uppercase mb-3 block" style={{ color: SUB }}>Select Color: {selectedColor}</span>
                      <div className="flex flex-wrap gap-3">
                        {uniqueColors.map(color => (
                          <button 
                            key={color}
                            onClick={() => { setSelectedColor(color); setActiveImage(0); setQty(1); setSelectedSize(''); }}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-[#D4AF37] scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {hasVariants && (
                    <div className="mb-8">
                      <SizeSelector 
                        variants={filteredVariants}
                        selectedSize={selectedSize}
                        setSelectedSize={setSelectedSize}
                        sizeError={sizeError}
                        setSizeError={setSizeError}
                        setShowSizeGuide={setShowSizeGuide}
                        fitType={product.fitType}
                        fitRecommendation={product.fitRecommendation} // Comes from AI injection in recommendationService
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-8">
                    <span className="text-[13px] font-medium uppercase tracking-widest" style={{ color: SUB }}>Quantity</span>
                    <div className="flex items-center rounded overflow-hidden" style={{ border: `1px solid ${BORD}` }}>
                      <button disabled={!availableStock} onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Minus size={14} /></button>
                      <span className="w-12 text-center text-[13px] font-medium">{Math.min(qty, availableStock || 1)}</span>
                      <button disabled={!availableStock || qty >= availableStock} onClick={() => setQty(q => Math.min(availableStock, q + 1))} className="w-10 h-10 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={14} /></button>
                    </div>
                  </div>

                  {availableStock > 0 ? (
                    <div className="flex flex-col gap-4">
                      <button onClick={async () => {
                        if (hasVariants && !selectedSize) {
                          setSizeError(true);
                          setTimeout(() => setSizeError(false), 2000);
                          return;
                        }
                        await addToCart(product, Math.min(qty, availableStock), selectedSize, selectedColor);
                      }} className="w-full py-4 text-[12px] font-bold tracking-widest uppercase transition-opacity hover:opacity-90 flex items-center justify-center gap-3" style={{ background: ACC, color: '#000', borderRadius: 4 }}>
                        <ShoppingBag size={16} /> Add To Cart
                      </button>
                      <div className="flex gap-4">
                        <button onClick={async () => {
                          if (hasVariants && !selectedSize) {
                            setSizeError(true);
                            setTimeout(() => setSizeError(false), 2000);
                            return;
                          }
                          await addToCart(product, Math.min(qty, availableStock), selectedSize, selectedColor);
                          navigate('/cart');
                        }} className="flex-1 py-4 text-[12px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-3 hover:bg-[#D4AF37] hover:text-black" style={{ background: 'transparent', border: `1px solid ${ACC}`, color: ACC, borderRadius: 4 }}>
                          Buy Now
                        </button>
                        <button onClick={() => toggleWishlist(product)} className={`w-14 flex items-center justify-center transition-colors ${isInWishlist(product._id) ? 'text-[#D4AF37]' : 'hover:text-[#D4AF37]'}`} style={{ border: `1px solid ${BORD}`, borderRadius: 4 }}>
                          <Heart size={18} fill={isInWishlist(product._id) ? '#D4AF37' : 'none'} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center rounded-lg" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)' }}>
                      <span className="text-red-500 font-bold tracking-widest uppercase">
                        {hasVariants && selectedSize ? 'Size Out of Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center rounded-lg" style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.1)' }}>
                  <span className="text-red-500 font-bold tracking-widest uppercase">
                    {!product.isActive ? 'Currently Unavailable' : 'Out of Stock'}
                  </span>
                </div>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              {[
                { i: Truck, t: 'Complimentary Shipping' },
                { i: RotateCcw, t: '14-Day Free Returns' },
                { i: Shield, t: '2-Year VIP Warranty' },
                { i: Package, t: 'Signature Packaging' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <item.i size={18} style={{ color: ACC }} />
                  <span className="text-[12px]" style={{ color: SUB }}>{item.t}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          2 · PRODUCT STORY
      ══════════════════════════════ */}
      <section className="py-32" style={{ background: SURF, borderTop: `1px solid ${BORD}`, borderBottom: `1px solid ${BORD}` }}>
        <div className="container-app max-w-4xl text-center">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-8" style={{ color: ACC }}>The Story</p>
          <h2 className="font-playfair leading-tight mb-12" style={{ fontSize: 'clamp(28px, 3.5vw, 48px)' }}>
            Uncompromising Excellence. <br /> Crafted for the extraordinary.
          </h2>
          <p className="text-[16px] leading-[1.8] font-light" style={{ color: SUB }}>
            {product.description}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════
          3 · FEATURES SHOWCASE
      ══════════════════════════════ */}
      <section className="py-24">
        <div className="container-app">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { i: Shield, t: 'Master Craftsmanship', d: 'Engineered with precision using the finest materials available globally.' },
              { i: Sparkles, t: 'Timeless Aesthetic', d: 'Designed to outlast trends, becoming a signature piece of your collection.' },
              { i: CheckCircle2, t: 'Authenticated Quality', d: 'Every item passes rigorous multi-point inspection before delivery.' },
            ].map((f, i) => (
              <div key={i} className="p-10 rounded-[20px] flex flex-col items-center text-center transition-transform hover:-translate-y-2" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                <f.i size={32} strokeWidth={1} style={{ color: ACC, marginBottom: 24 }} />
                <h4 className="font-playfair text-xl mb-4">{f.t}</h4>
                <p className="text-[13px] leading-relaxed" style={{ color: SUB }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          4 · SPECIFICATIONS
      ══════════════════════════════ */}
      <section className="py-24" style={{ background: SURF, borderTop: `1px solid ${BORD}` }}>
        <div className="container-app max-w-3xl">
          <h2 className="font-playfair text-3xl mb-12 text-center">Specifications</h2>
          <div className="flex flex-col gap-4">
            {[
              { id: 'materials', title: 'Materials & Finish', content: 'Premium grade materials meticulously sourced and finished by master artisans. Designed for durability and timeless elegance.' },
              { id: 'dimensions', title: 'Dimensions & Fit', content: 'Precision engineered to perfect proportions. Please refer to our size guide or consult the AI Concierge for specific measurements.' },
              { id: 'care', title: 'Care Instructions', content: 'Maintain the pristine condition using the included microfiber cloth. Avoid direct contact with harsh chemicals or extreme temperatures.' },
              { id: 'shipping', title: 'Shipping & Returns', content: 'Complimentary expedited shipping worldwide. Includes signature luxury packaging. Returns accepted within 14 days of delivery.' },
            ].map(s => (
              <div key={s.id} className="border-b" style={{ borderColor: BORD }}>
                <button onClick={() => setActiveSpec(activeSpec === s.id ? '' : s.id)} className="w-full py-6 flex items-center justify-between text-left transition-colors hover:text-[#D4AF37]">
                  <span className="font-playfair text-xl">{s.title}</span>
                  {activeSpec === s.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <AnimatePresence>
                  {activeSpec === s.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="pb-8 text-[14px] leading-relaxed" style={{ color: SUB }}>{s.content}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          7 · AI PRODUCT CONCIERGE V13
      ══════════════════════════════ */}
      <section className="py-24">
        <div className="container-app max-w-6xl">
          <div className="rounded-[28px] relative overflow-hidden" style={{ background: '#050505', border: '1px solid #1A1A1A' }}>
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 80% 50%, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.4), transparent)' }} />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* LEFT: Header + quick prompts */}
              <div className="p-12 md:p-16 border-r border-[#1A1A1A]">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-bold tracking-[0.22em] uppercase mb-8" style={{ background: 'rgba(212,175,55,0.08)', color: ACC, border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Sparkles size={9} /> Private AI Concierge
                </div>
                <h2 className="font-playfair text-white text-4xl lg:text-5xl mb-5 leading-tight">Ask our<br />Concierge.</h2>
                <p className="text-[14px] text-gray-500 leading-relaxed mb-10 max-w-sm">
                  Not sure if this is right for you? Our private advisor compares alternatives, explains craftsmanship, and curates a personalised recommendation — in real time.
                </p>

                {/* Quick question chips */}
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Compare with similar pieces',  prompt: `Compare the ${product?.name} with similar ${product?.category?.name || 'luxury'} alternatives in the same price range.` },
                    { label: 'Is this a good gift?',         prompt: `Is the ${product?.name} by ${product?.brand} a good luxury gift? Who would appreciate it most?` },
                    { label: 'Tell me about craftsmanship',  prompt: `Explain the craftsmanship, materials, and heritage behind the ${product?.name} by ${product?.brand}.` },
                    { label: 'Find me something similar',   prompt: `Find me luxury products similar to the ${product?.name} by ${product?.brand}.` },
                  ].map((item, i) => (
                    <motion.button
                      key={i}
                      onMouseEnter={() => setConciergeHovered(i)}
                      onMouseLeave={() => setConciergeHovered(null)}
                      onClick={() => openConcierge(item.prompt)}
                      className="group relative text-left px-5 py-4 rounded-xl transition-all duration-300 overflow-hidden"
                      style={{ background: conciergeHovered === i ? 'rgba(212,175,55,0.06)' : '#0B0B0B', border: `1px solid ${conciergeHovered === i ? 'rgba(212,175,55,0.4)' : '#1A1A1A'}` }}
                      whileHover={{ x: 4 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-gray-300 group-hover:text-white transition-colors font-medium">{item.label}</span>
                        <ArrowRight size={14} className="text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* RIGHT: CTA + Product card */}
              <div className="p-12 md:p-16 flex flex-col">
                {/* Product mini card */}
                {product && (
                  <div className="mb-8 p-5 rounded-2xl flex items-center gap-5" style={{ background: '#0B0B0B', border: '1px solid #1A1A1A' }}>
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: '#111' }}>
                      <img
                        src={product.images?.[0]?.url}
                        alt={product.name}
                        className="w-full h-full object-contain p-2"
                        onError={e => { e.currentTarget.src = getLuxuryFallback(product?.category?.name); }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] uppercase tracking-widest text-gray-500 mb-0.5">{product.brand}</p>
                      <h4 className="font-playfair text-white text-[15px] leading-tight truncate">{product.name}</h4>
                      <p className="text-[#D4AF37] text-[13px] mt-1">{formatPrice(product.discountPrice || product.price)}</p>
                    </div>
                    <div className="ml-auto shrink-0">
                      <div className="flex flex-col items-center">
                        <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />
                        <span className="text-[11px] text-gray-400 mt-0.5">{(product.ratings?.average || 5).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Main CTA */}
                <motion.button
                  onClick={() => openConcierge()}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-5 rounded-xl text-black font-bold text-[13px] tracking-widest uppercase flex items-center justify-center gap-3 mb-5 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #F5D78E 50%, #D4AF37 100%)' }}
                >
                  <Sparkles size={15} />
                  Open in Concierge
                </motion.button>

                {/* Stat grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Zap, label: 'Real-time', sub: 'Inventory' },
                    { icon: GitCompare, label: 'Smart', sub: 'Compare' },
                    { icon: Award, label: 'Expert', sub: 'Advisory' },
                  ].map(({ icon: Icon, label, sub }, i) => (
                    <div key={i} className="p-4 rounded-xl text-center" style={{ background: '#0B0B0B', border: '1px solid #1A1A1A' }}>
                      <Icon size={16} className="text-[#D4AF37] mx-auto mb-2" />
                      <p className="text-[11px] text-white font-semibold">{label}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Trust line */}
                <p className="mt-6 text-center text-[9px] text-gray-600 uppercase tracking-widest">
                  Powered by Gemini · Verified MongoDB Inventory
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          5 · REVIEWS & AI SUMMARY
      ══════════════════════════════ */}
      <section id="reviews" className="py-24" style={{ background: SURF, borderTop: `1px solid ${BORD}` }}>
        <div className="container-app max-w-5xl">
          <h2 className="font-playfair text-3xl mb-12 text-center">Client Reviews</h2>
          
          {/* AI Sentiment Summary */}
          {product.numReviews > 0 && (
            <div className="mb-16 p-8 rounded-[20px] flex gap-6 items-start" style={{ background: isDark ? 'rgba(212,175,55,0.05)' : 'rgba(201,169,110,0.08)', border: `1px solid rgba(212,175,55,0.2)` }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #D4AF37, #B38945)' }}>
                <Sparkles size={20} color="#000" />
              </div>
              <div>
                <h4 className="font-playfair text-xl mb-3">AI Sentiment Summary</h4>
                <p className="text-[14px] leading-relaxed" style={{ color: SUB }}>
                  {aiReviewLoading ? <span className="flex items-center gap-2"><Activity className="animate-spin text-[#D4AF37]" size={14} /> Distilling reviews...</span> : aiReviewSummary}
                </p>
              </div>
            </div>
          )}

          <ProductReviews productId={product._id} />
        </div>
      </section>

      {/* ══════════════════════════════
          6 · SMART RECOMMENDATIONS
      ══════════════════════════════ */}
      {[
        { title: 'Frequently Bought Together', data: recs.frequentlyBoughtTogether },
        { title: 'Premium Upgrade', data: recs.premiumUpgrade },
        { title: 'Similar Style', data: recs.similarStyle },
        { title: 'Luxury Alternatives', data: recs.luxuryAlternatives },
      ].map((block, i) => block.data?.length > 0 && (
        <section key={i} className="py-16" style={{ borderTop: `1px solid ${BORD}` }}>
          <div className="container-app">
            <h2 className="font-playfair text-3xl mb-12 text-center">{block.title}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {block.data.map(r => (
                <div key={r._id} className="group relative flex flex-col rounded-[20px] overflow-hidden transition-transform hover:-translate-y-2" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                  <button 
                    onClick={(e) => { e.preventDefault(); toggleWishlist(r); }}
                    className={`absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isInWishlist(r._id) ? 'bg-white text-[#D4AF37]' : 'bg-white/50 text-gray-500 hover:text-[#D4AF37] hover:bg-white'}`}
                  >
                    <Heart size={14} fill={isInWishlist(r._id) ? '#D4AF37' : 'none'} />
                  </button>
                  <Link to={`/product/${r.slug}`} className="flex-1">
                    {r.matchScore > 50 && (
                      <div className="absolute top-4 left-4 z-10 px-2 py-1 bg-black/80 backdrop-blur border border-[#D4AF37]/30 text-[#D4AF37] text-[9px] uppercase tracking-widest font-bold rounded">
                        {r.matchScore}% Match
                      </div>
                    )}
                    <div className="h-[280px] flex items-center justify-center p-6" style={{ background: isDark ? '#111' : '#F2EDE4' }}>
                      <img loading="lazy" src={r.images[0]?.url || '/assets/placeholders/luxury-placeholder.jpg'} alt={r.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500"  onError={(e) => {
      let cat = 'default';
      try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
      try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
      try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
      try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
      try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
      e.currentTarget.src = getLuxuryFallback(cat);
    }} />
                    </div>
                  <div className="p-6">
                    <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: SUB }}>{r.brand}</p>
                    <h3 className="font-playfair text-lg truncate mb-3 group-hover:text-[#D4AF37] transition-colors">{r.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium">{formatPrice(r.discountPrice || r.price)}</span>
                      <div className="flex items-center gap-1">
                        <Star size={12} fill={ACC} style={{ color: ACC }} />
                        <span className="text-[12px]">{r.ratings?.average || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ══════════════════════════════
          8 · SIZE CHART MODAL
      ══════════════════════════════ */}
      <SizeGuideModal 
        isOpen={showSizeGuide} 
        onClose={() => setShowSizeGuide(false)} 
        sizeChart={product.sizeChart || product.sizeChartHtml} 
      />

    </div>
  );
}
