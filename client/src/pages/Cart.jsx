// NexORA V13 — Luxury Cart Experience

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ArrowRight, Plus, Minus, Heart, Sparkles, ShoppingBag, ShieldCheck, Tag, ShoppingCart, MessageSquare, Zap } from 'lucide-react';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { productService } from '@services/productService';
import axios from 'axios';
import { getSessionId } from '../hooks/usePreferenceTracking';
import { Activity } from 'lucide-react';
import { getLuxuryFallback } from '../utils/getLuxuryFallback';
import { formatPrice } from '../utils/formatPrice';

export default function Cart() {
  const { 
    items: cartItems = [], 
    removeItem: removeFromCart, 
    updateItem: updateQuantity, 
    totalPrice: cartTotal = 0, 
    clearCart 
  } = useCart();
  const { addToWishlist } = useWishlist();

  const navigate = useNavigate();

  // V13: Open concierge with cart context pre-loaded
  const openConciergeWithCart = useCallback(() => {
    const cartSummary = cartItems.map(i => `${i.name} (x${i.quantity})`).join(', ');
    sessionStorage.setItem('nexora_concierge_prompt',
      `I have ${cartItems.length} item(s) in my cart: ${cartSummary}. Total: ${formatPrice(cartTotal)}. Can you help me complete my purchase, find a discount, or suggest complementary pieces?`
    );
    navigate('/concierge');
  }, [cartItems, cartTotal, navigate]);

  const handleMoveToWishlist = async (item) => {
    await addToWishlist(item);
    await removeFromCart(item._id);
  };

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const ob = new MutationObserver(sync);
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => ob.disconnect();
  }, []);

  // Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (cartItems.length > 0) {
      setAiLoading(true);
      axios.post('/api/preferences/cart', { cartItems }, {
        headers: { 'x-session-id': getSessionId() }
      })
      .then(res => {
        setRecommendations(res.data.data || []);
        setAiLoading(false);
      })
      .catch(err => {
        console.error('Cart Recommendation Error:', err);
        setAiLoading(false);
      });
    }
  }, [cartItems]);

  const BG   = isDark ? '#050505' : 'transparent';
  const SURF = isDark ? '#0B0B0B' : '#FFFFFF';
  const BORD = isDark ? '#1A1A1A' : '#E8E2D9';
  const TEXT = isDark ? '#FFFFFF' : '#111111';
  const SUB  = isDark ? '#9CA3AF' : '#6B7280';
  const ACC  = isDark ? '#D4AF37' : '#C9A96E';

  // ── EMPTY STATE ──
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20" style={{ background: BG }}>
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 40%, ${isDark ? 'rgba(212,175,55,0.08)' : 'rgba(201,169,110,0.1)'} 0%, transparent 60%)` }} />
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center flex flex-col items-center">
          <div className="w-32 h-32 rounded-full mb-8 flex items-center justify-center relative">
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/30" style={{ animation: 'orbSpin 8s linear infinite' }} />
            <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              <ShoppingCart size={48} className="text-[#D4AF37]" strokeWidth={1.5} />
            </div>
          </div>
          <h2 className="font-playfair text-4xl lg:text-5xl mb-4" style={{ color: TEXT }}>Your Collection Awaits</h2>
          <p className="text-[14px] max-w-sm mb-10 leading-relaxed" style={{ color: SUB }}>
            Your shopping bag is currently empty. Discover our curated selection of extraordinary items to begin your collection.
          </p>
          <button onClick={() => navigate('/products')} className="px-10 py-4 text-[12px] font-bold tracking-widest uppercase transition-all hover:scale-105" style={{ background: ACC, color: '#000', borderRadius: 4 }}>
            Explore Luxury Collection
          </button>
        </motion.div>

        <style>{`@keyframes orbSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const shipping = cartTotal > 0 ? 0 : 0;
  const tax = cartTotal * 0.08; // Example tax
  const finalTotal = cartTotal + shipping + tax;

  return (
    <div className="min-h-screen font-jakarta pb-32 pt-32" style={{ background: BG, color: TEXT }}>
      <div className="container-app">
        
        <h1 className="font-playfair text-4xl lg:text-5xl mb-12">Shopping Bag</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* ══════════════════════════════
              LEFT: CART ITEMS (70%)
          ══════════════════════════════ */}
          <div className="flex-1 lg:w-[70%]">
            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="group relative flex flex-col sm:flex-row gap-6 p-6 transition-all hover:-translate-y-1"
                    style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 20, boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.2)' : '0 10px 40px rgba(0,0,0,0.02)' }}
                  >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" style={{ boxShadow: 'inset 0 0 30px rgba(212,175,55,0.05)', borderRadius: 20 }} />

                    {/* Image */}
                    <Link to={`/product/${item.slug || item._id}`} className="w-full sm:w-40 h-40 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: isDark ? '#111' : '#F2EDE4' }}>
                      <img loading="lazy" src={item.image || getLuxuryFallback(item.category?.name || item.category || 'default')} alt={item.name} className="w-full h-full object-contain p-4 mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700"  onError={(e) => {
    e.currentTarget.onerror = null;
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }} />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 flex flex-col relative z-10">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: SUB }}>
                            {item.brand || 'Luxury'}
                            {item.size && ` • Size: ${item.size}`}
                            {item.color && ` • ${item.color}`}
                          </p>
                          <Link to={`/product/${item.slug || item._id}`} className="font-playfair text-xl hover:text-[#D4AF37] transition-colors">{item.name}</Link>
                          
                          {/* Fit Intelligence Tags */}
                          {(item.fitType || item.fitWarning) && (
                            <div className="flex flex-wrap gap-2 mt-2 mb-1">
                              {item.fitType && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border border-[#D4AF37]/30 text-[#D4AF37] bg-black/20">
                                  Fit: {item.fitType}
                                </span>
                              )}
                              {item.confidence && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border border-gray-500/30 text-gray-400 bg-black/20">
                                  {item.confidence}% Confidence
                                </span>
                              )}
                              {item.fitWarning && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border border-red-500/30 text-red-400 bg-red-500/10">
                                  {item.fitWarning}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-xl font-medium tracking-tight">{formatPrice(item.price)}</span>
                      </div>

                      {item.stock === 0 || item.isActive === false ? (
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-[9px] font-bold tracking-widest uppercase mb-6 w-fit" style={{ background: 'rgba(255,0,0,0.1)', color: '#EF4444' }}>
                          {!item.isActive ? 'Currently Unavailable' : 'Out of Stock'}
                        </div>
                      ) : item.stock > 0 && item.stock < 5 ? (
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-[9px] font-bold tracking-widest uppercase mb-6 w-fit" style={{ background: 'rgba(212,175,55,0.1)', color: ACC }}>
                          Only {item.stock} Left In Stock
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-[9px] font-bold tracking-widest uppercase mb-6 w-fit" style={{ background: 'rgba(212,175,55,0.1)', color: ACC }}>
                          In Stock
                        </div>
                      )}

                      <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Qty */}
                        <div className="flex items-center rounded overflow-hidden w-fit" style={{ border: `1px solid ${BORD}`, opacity: item.stock === 0 || item.isActive === false ? 0.5 : 1 }}>
                          <button disabled={item.stock === 0 || item.isActive === false} onClick={() => updateQuantity(item._id, item.quantity - 1, item.size)} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:cursor-not-allowed"><Minus size={12} /></button>
                          <span className="w-10 text-center text-[12px] font-medium">{item.quantity}</span>
                          <button disabled={item.stock === 0 || item.isActive === false || item.quantity >= item.stock} onClick={() => updateQuantity(item._id, item.quantity + 1, item.size)} className="w-8 h-8 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:cursor-not-allowed"><Plus size={12} /></button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleMoveToWishlist(item)} className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase hover:text-[#D4AF37] transition-colors" style={{ color: SUB }}>
                            <Heart size={14} /> Wishlist
                          </button>
                          <span style={{ color: BORD }}>|</span>
                          <button onClick={() => removeFromCart(item._id)} className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-red-500 hover:text-red-400 transition-colors">
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* ══════════════════════════════
              RIGHT: ORDER SUMMARY (30%)
          ══════════════════════════════ */}
          <div className="w-full lg:w-[350px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-6">
              
              {/* Summary Card */}
              <div className="p-8 rounded-[24px]" style={{ background: SURF, border: `1px solid ${BORD}` }}>
                <h2 className="font-playfair text-2xl mb-8">Order Summary</h2>
                
                <div className="flex flex-col gap-4 text-[13px] mb-8" style={{ color: SUB }}>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span style={{ color: TEXT }}>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span style={{ color: ACC }}>Complimentary</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax</span>
                    <span style={{ color: TEXT }}>{formatPrice(tax)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-end pt-6 mb-8" style={{ borderTop: `1px solid ${BORD}` }}>
                  <span className="text-[14px] font-medium">Total</span>
                  <span className="text-3xl font-medium tracking-tight">{formatPrice(finalTotal)}</span>
                </div>

                {/* Discount */}
                <div className="relative mb-8">
                  <input 
                    type="text" 
                    placeholder="Gift card or discount code" 
                    className="w-full text-[12px] px-4 py-3.5 outline-none transition-colors"
                    style={{ background: 'transparent', border: `1px solid ${BORD}`, borderRadius: 4, color: TEXT }}
                  />
                  <button className="absolute right-3 top-2.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded" style={{ background: isDark ? '#222' : '#EEE', color: TEXT }}>
                    Apply
                  </button>
                </div>

                {/* V13: Ask Concierge CTA */}
                <div className="mb-6 p-5 rounded-xl relative overflow-hidden" style={{ background: '#050505', border: '1px solid #1A1A1A' }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 50%, rgba(212,175,55,0.08) 0%, transparent 60%)' }} />
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(212,175,55,0.35), transparent)' }} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 flex items-center justify-center">
                        <Sparkles size={10} className="text-[#D4AF37]" />
                      </div>
                      <p className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-bold">Private Concierge</p>
                    </div>
                    <p className="text-[12px] text-gray-400 leading-relaxed mb-4">
                      Ask our AI advisor to find a discount code, suggest complementary pieces, or help you decide.
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        { label: 'Find a discount code',      prompt: `I have ${cartItems.length} items in my cart. Do you have any discount codes or offers for me?` },
                        { label: 'Suggest complementary pieces', prompt: `I have these items in my cart: ${cartItems.map(i => i.name).join(', ')}. What luxury pieces would complement them?` },
                        { label: 'Help me decide',             prompt: `I have ${cartItems.length} items in my cart totalling ${formatPrice(cartTotal)}. Is this a good buy? Should I reconsider anything?` },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            sessionStorage.setItem('nexora_concierge_prompt', item.prompt);
                            navigate('/concierge');
                          }}
                          className="w-full text-left px-3.5 py-2.5 rounded-lg text-[11px] text-gray-400 hover:text-[#D4AF37] transition-colors group flex items-center justify-between"
                          style={{ background: '#0B0B0B', border: '1px solid #1A1A1A' }}
                        >
                          {item.label}
                          <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 text-[#D4AF37] transition-all" />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={openConciergeWithCart}
                      className="mt-3 w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-[#D4AF37] hover:text-black"
                      style={{ border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37', background: 'transparent' }}
                    >
                      <MessageSquare size={10} /> Open Full Concierge
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/checkout')} 
                  className={`w-full py-4 text-[12px] font-bold tracking-widest uppercase transition-opacity flex items-center justify-center gap-3 mb-4 ${cartItems.some(i => i.stock === 0 || i.isActive === false || i.quantity > i.stock) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'hover:opacity-90'}`}
                  style={cartItems.some(i => i.stock === 0 || i.isActive === false || i.quantity > i.stock) ? {} : { background: ACC, color: '#000', borderRadius: 4 }}
                  disabled={cartItems.some(i => i.stock === 0 || i.isActive === false || i.quantity > i.stock)}
                >
                  {cartItems.some(i => i.stock === 0 || i.isActive === false || i.quantity > i.stock) ? 'Update Invalid Items to Checkout' : (
                    <>Secure Checkout <ShieldCheck size={16} /></>
                  )}
                </button>
                <p className="text-center text-[10px] uppercase tracking-widest" style={{ color: SUB }}>256-bit SSL Encrypted</p>
              </div>

              {/* AI Cart Intelligence */}
              {recommendations.length > 0 && (
                <div className="p-6 rounded-[24px] overflow-hidden relative" style={{ background: '#050505', border: '1px solid #1A1A1A' }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at top right, rgba(212,175,55,0.1) 0%, transparent 70%)' }} />
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[8px] font-bold tracking-[0.2em] uppercase mb-4" style={{ background: 'rgba(212,175,55,0.1)', color: ACC, border: '1px solid rgba(212,175,55,0.2)' }}>
                      <Sparkles size={10} /> AI Recommendations
                    </div>
                    <h3 className="font-playfair text-white text-lg mb-6">Complete Your Collection</h3>
                    
                    <div className="flex flex-col gap-4">
                      {aiLoading ? (
                        <div className="flex flex-col items-center justify-center py-6 text-[#6B7280]">
                          <Activity className="animate-spin text-[#D4AF37] mb-3" size={24} />
                          <span className="text-xs">Curating your collection...</span>
                        </div>
                      ) : (
                        recommendations.map(r => (
                          <Link key={r._id} to={`/product/${r.slug}`} className="flex items-center gap-4 group">
                            <div className="w-16 h-16 rounded flex items-center justify-center bg-[#111] shrink-0 border border-white/5 group-hover:border-[#D4AF37]/50 transition-colors">
                              <img loading="lazy" src={r.primaryImage?.url || r.images?.[0]?.url || getLuxuryFallback(r.category?.name || r.category || 'default')} alt="" className="w-10 h-10 object-contain"  onError={(e) => {
    e.currentTarget.onerror = null;
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }} />
                            </div>
                            <div>
                              <h4 className="text-[12px] font-medium text-white group-hover:text-[#D4AF37] transition-colors leading-snug">{r.name}</h4>
                              <p className="text-[11px] text-gray-400 mt-1">{formatPrice(r.price || r.discountPrice)}</p>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
