// NexORA V7 — Luxury Product Detail Experience

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Heart, Star, Shield, Truck, Package, RotateCcw, ChevronDown, ChevronUp, Sparkles, MessageSquare, Plus, Minus, ArrowRight, CheckCircle2, Activity, X } from 'lucide-react';
import { productService } from '@services/productService';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import ProductReviews from '@components/product/ProductReviews';
import aiService from '@services/aiService';
import axios from 'axios';
import usePreferenceTracking, { getSessionId } from '../hooks/usePreferenceTracking';
import { getLuxuryFallback } from '../utils/getLuxuryFallback';
import { formatPrice } from '../utils/formatPrice';

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
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeError, setSizeError] = useState(false);

  const hasVariants = product?.variants && product.variants.length > 0;
  const currentVariant = hasVariants ? product.variants.find(v => v.size === selectedSize) : null;
  const availableStock = hasVariants ? (currentVariant?.stock || 0) : product?.stock || 0;

  // AI States
  const [aiReviewSummary, setAiReviewSummary] = useState('');
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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
      
      {/* ══════════════════════════════
          1 · PRODUCT HERO
      ══════════════════════════════ */}
      <section className="container-app pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
          
          {/* LEFT: Gallery */}
          <div className="flex gap-6 h-fit lg:sticky lg:top-32">
            {/* Thumbnails */}
            <div className="hidden md:flex flex-col gap-4 w-20 shrink-0">
              {product.images?.map((img, i) => (
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
                  src={product.images[activeImage]?.url} 
                  alt={product.name}
                  className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-700 group-hover:scale-110"
                  style={{ mixBlendMode: isDark ? 'normal' : 'multiply' }}
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
                  {hasVariants && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[12px] font-bold tracking-widest uppercase" style={{ color: SUB }}>Select Size</span>
                        {product.sizeChartHtml && (
                          <button onClick={() => setShowSizeGuide(true)} className="text-[11px] uppercase tracking-widest hover:underline" style={{ color: ACC }}>Size Guide</button>
                        )}
                      </div>
                      <div className={`flex flex-wrap gap-3 p-2 -m-2 rounded transition-colors duration-300 ${sizeError ? 'bg-red-500/10 border border-red-500/30' : ''}`}>
                        {product.variants.map(v => (
                          <button 
                            key={v.size}
                            disabled={v.stock === 0}
                            onClick={() => { setSelectedSize(v.size); setSizeError(false); setQty(1); }}
                            className={`min-w-[48px] h-12 flex items-center justify-center px-4 rounded transition-all text-sm font-medium ${v.stock === 0 ? 'opacity-30 cursor-not-allowed line-through' : selectedSize === v.size ? 'border-2 scale-105 shadow-lg' : 'hover:border opacity-80'}`}
                            style={{ 
                              border: selectedSize === v.size ? `2px solid ${ACC}` : `1px solid ${BORD}`, 
                              background: selectedSize === v.size ? ACC : SURF, 
                              color: selectedSize === v.size ? '#000' : TEXT 
                            }}
                          >
                            {v.size}
                          </button>
                        ))}
                      </div>
                      {sizeError && <p className="text-red-500 text-xs mt-2 font-medium">Please select a size to continue</p>}
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
                        await addToCart(product, Math.min(qty, availableStock), selectedSize);
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
                          await addToCart(product, Math.min(qty, availableStock), selectedSize);
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
          7 · AI PRODUCT CONCIERGE
      ══════════════════════════════ */}
      <section className="py-24">
        <div className="container-app max-w-5xl">
          <div className="rounded-[24px] p-12 md:p-16 relative overflow-hidden" style={{ background: '#0B0B0B', border: '1px solid #1A1A1A' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at right center, rgba(212,175,55,0.1) 0%, transparent 60%)' }} />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded text-[9px] font-bold tracking-[0.22em] uppercase mb-6" style={{ background: 'rgba(212,175,55,0.1)', color: ACC, border: '1px solid rgba(212,175,55,0.2)' }}>
                  <Sparkles size={10} /> AI Product Concierge
                </div>
                <h2 className="font-playfair text-white text-3xl lg:text-4xl mb-6">Ask AI About This Product</h2>
                <p className="text-[14px] text-gray-400 leading-relaxed mb-8">
                  Unsure if this is the right choice? Our AI Concierge can provide detailed pros and cons, compare it with alternatives, or suggest the best use cases for your lifestyle.
                </p>
                <div className="flex flex-col gap-3">
                  {['Compare with similar items', 'What are the pros and cons?', 'Is this good for a luxury gift?'].map((q, i) => (
                    <button 
                      key={i} 
                      onClick={async () => {
                        setAiQuestion(q);
                        setAiLoading(true);
                        try {
                          const res = await aiService.chat(`Regarding ${product.name}: ${q}`, []);
                          setAiResponse(res.data.data.response);
                        } catch (e) {
                          setAiResponse('AI insights are temporarily unavailable.');
                        }
                        setAiLoading(false);
                      }}
                      className="text-left px-5 py-3.5 text-[13px] text-gray-300 hover:text-[#D4AF37] transition-colors rounded" style={{ background: '#141414', border: '1px solid #1E1E1E' }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center w-full">
                {aiResponse || aiLoading ? (
                  <div className="w-full bg-[#111] p-6 rounded-xl border border-[#D4AF37]/20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-30" />
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-3">Concierge Response</h3>
                    {aiLoading ? (
                      <div className="flex items-center gap-3 text-gray-400 text-sm py-4">
                        <Activity className="animate-spin text-[#D4AF37]" size={16} /> Analyzing product context...
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed text-gray-300">{aiResponse}</p>
                    )}
                    <button onClick={() => {setAiResponse(''); setAiQuestion('')}} className="mt-4 text-[10px] uppercase tracking-widest text-[#6B7280] hover:text-white transition-colors">Clear</button>
                  </div>
                ) : (
                  <div className="relative w-64 h-64 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border border-[#D4AF37]/30" style={{ animation: 'orbSpin 10s linear infinite' }} />
                    <div className="w-48 h-48 rounded-full flex items-center justify-center bg-[#050505] shadow-[0_0_50px_rgba(212,175,55,0.15)]" style={{ border: '1px solid rgba(212,175,55,0.5)' }}>
                      <MessageSquare size={48} style={{ color: ACC }} />
                    </div>
                  </div>
                )}
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
      <AnimatePresence>
        {showSizeGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSizeGuide(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl rounded-2xl overflow-hidden p-8 max-h-[90vh] overflow-y-auto shadow-2xl" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              <button onClick={() => setShowSizeGuide(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors z-10">
                <X size={16} />
              </button>
              <h2 className="font-playfair text-3xl mb-8 text-center" style={{ color: TEXT }}>Size Guide</h2>
              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: product.sizeChartHtml }} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
