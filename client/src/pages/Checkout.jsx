// NexORA V7 — Luxury Checkout Experience

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Truck, CreditCard, CheckCircle2, Package, Sparkles, Star, ShoppingBag } from 'lucide-react';
import { useCart } from '@context/CartContext';
import { orderService } from '@services/orderService';
import { paymentService } from '@services/paymentService';
import { discountService } from '@services/discountService';
import { getLuxuryFallback } from '../utils/getLuxuryFallback';
import { formatPrice } from '../utils/formatPrice';

export default function Checkout() {
  const { items: cartItems, totalPrice: cartTotal, clearCart, addToCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Local State
  const [address, setAddress] = useState({ street: '', city: '', state: '', zip: '', country: '' });
  const [delivery, setDelivery] = useState('standard');
  const [payment, setPayment] = useState('card');

  // Discount State
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscountCode, setAppliedDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);

  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiSuggestLoading, setAiSuggestLoading] = useState(false);
  const [suggestPanelOpen, setSuggestPanelOpen] = useState(true);


  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
    sync();
    const ob = new MutationObserver(sync);
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => ob.disconnect();
  }, []);

  const BG   = isDark ? '#050505' : 'transparent';
  const SURF = isDark ? '#0B0B0B' : '#FFFFFF';
  const BORD = isDark ? '#1A1A1A' : '#E8E2D9';
  const TEXT = isDark ? '#FFFFFF' : '#111111';
  const SUB  = isDark ? '#9CA3AF' : '#6B7280';
  const ACC  = isDark ? '#D4AF37' : '#C9A96E';

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  // Fetch AI checkout suggestions when entering Step 2
  useEffect(() => {
    if (step === 2 && aiSuggestions.length === 0 && cartItems?.length > 0) {
      setAiSuggestLoading(true);
      const cartProductIds = cartItems.map(i => i.product?._id || i._id).filter(Boolean);
      fetch('/api/ai/checkout-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartProductIds })
      })
        .then(r => r.json())
        .then(d => { if (d.success) setAiSuggestions(d.data || []); })
        .catch(() => {})
        .finally(() => setAiSuggestLoading(false));
    }
  }, [step]);

  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  // Delivery Options
  const deliveryOptions = [
    { id: 'standard', name: 'Standard Delivery', desc: '3-5 Business Days', price: 0, icon: Truck },
    { id: 'express', name: 'Express Delivery', desc: '1-2 Business Days', price: 25, icon: Package },
    { id: 'priority', name: 'Priority Courier', desc: 'Same Day Delivery', price: 50, icon: ShieldCheck },
  ];

  // Payment Options
  const paymentOptions = [
    { id: 'card', name: 'Credit Card', icon: CreditCard },
    { id: 'stripe', name: 'Stripe', icon: CheckCircle2 },
    { id: 'paypal', name: 'PayPal', icon: CheckCircle2 },
  ];

  const shippingPrice = deliveryOptions.find(d => d.id === delivery)?.price || 0;
  const taxPrice = cartTotal * 0.15;
  const finalTotal = cartTotal + shippingPrice + taxPrice - discountAmount;

  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) return;
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const { data } = await discountService.validate(discountCodeInput.trim(), cartTotal);
      setDiscountAmount(data.data.discountAmount);
      setAppliedDiscountCode(discountCodeInput.trim().toUpperCase());
      setDiscountCodeInput(''); // clear input after success
    } catch (err) {
      setDiscountError(err.response?.data?.message || 'Invalid discount code');
      setDiscountAmount(0);
      setAppliedDiscountCode('');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountAmount(0);
    setAppliedDiscountCode('');
    setDiscountCodeInput('');
    setDiscountError('');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (step < 4) return setStep(step + 1);

    setError('');
    setLoading(true);

    try {
      const taxPrice = cartTotal * 0.15;
      const computedFinalTotal = cartTotal + shippingPrice + taxPrice;

      const orderPayload = {
        orderItems: cartItems.map(item => ({
          product: item.product?._id || item.product || item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity
        })),
        shippingAddress: address,
        paymentMethod: payment,
        deliveryMethod: delivery,
        discountCode: appliedDiscountCode || undefined,
        itemsPrice: cartTotal,
        taxPrice: taxPrice,
        shippingPrice: shippingPrice,
        totalPrice: computedFinalTotal - discountAmount
      };

      const { data: orderData } = await orderService.placeOrder(orderPayload);
      const orderId = orderData.data._id;
      const { data: initData } = await paymentService.initiate({ orderId, paymentMethod: payment });
      const paymentId = initData.data._id;

      await new Promise(resolve => setTimeout(resolve, 1500));
      const isSuccess = Math.random() > 0.1;

      await paymentService.verify({ paymentId, simulateStatus: isSuccess ? 'success' : 'failed' });

      if (isSuccess) {
        clearCart();
        navigate(`/order-success?orderId=${orderId}`);
      } else {
        navigate(`/payment-failure?orderId=${orderId}&paymentId=${paymentId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Shipping', 'Delivery', 'Payment', 'Review'];

  return (
    <div className="min-h-screen font-jakarta pb-32 pt-32" style={{ background: BG, color: TEXT }}>
      <div className="container-app max-w-6xl">
        
        {/* ── HEADER ── */}
        <div className="mb-12 text-center">
          <h1 className="font-playfair text-3xl lg:text-4xl tracking-tight mb-4 flex items-center justify-center gap-3">
            <ShieldCheck size={32} style={{ color: ACC }} /> Secure Checkout
          </h1>
        </div>

        {/* ── PROGRESS BAR ── */}
        <div className="max-w-3xl mx-auto mb-16 relative">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] -translate-y-1/2" style={{ background: BORD }} />
          <div className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 transition-all duration-500" style={{ background: ACC, width: `${((step - 1) / (steps.length - 1)) * 100}%` }} />
          
          <div className="flex justify-between relative z-10">
            {steps.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-medium transition-all duration-500"
                  style={{ 
                    background: step > i ? ACC : SURF,
                    color: step > i ? '#000' : SUB,
                    border: `1px solid ${step > i ? ACC : BORD}`,
                    boxShadow: step === i + 1 ? `0 0 20px rgba(212,175,55,0.4)` : 'none'
                  }}
                >
                  {step > i + 1 ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span className="hidden sm:block text-[11px] font-bold tracking-widest uppercase" style={{ color: step >= i + 1 ? TEXT : SUB }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* ── MAIN CONTENT ── */}
          <div className="lg:col-span-7">
            <div className="p-8 md:p-10 rounded-[24px]" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              
              {error && <div className="p-4 rounded bg-red-500/10 border border-red-500/20 text-red-500 mb-6 text-sm">{error}</div>}

              <form id="checkout-form" onSubmit={handleCheckout}>
                <AnimatePresence mode="wait">
                  
                  {/* STEP 1: SHIPPING */}
                  {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h2 className="font-playfair text-2xl mb-8">Shipping Information</h2>
                      <div className="grid gap-6">
                        <div>
                          <label className="block text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: SUB }}>Street Address</label>
                          <input required type="text" name="street" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} className="w-full text-[13px] px-4 py-3.5 outline-none rounded" style={{ background: 'transparent', border: `1px solid ${BORD}`, color: TEXT }} placeholder="123 Luxury Ave" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: SUB }}>City</label>
                            <input required type="text" name="city" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} className="w-full text-[13px] px-4 py-3.5 outline-none rounded" style={{ background: 'transparent', border: `1px solid ${BORD}`, color: TEXT }} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: SUB }}>State / Province</label>
                            <input required type="text" name="state" value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} className="w-full text-[13px] px-4 py-3.5 outline-none rounded" style={{ background: 'transparent', border: `1px solid ${BORD}`, color: TEXT }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: SUB }}>Zip Code</label>
                            <input required type="text" name="zip" value={address.zip} onChange={(e) => setAddress({...address, zip: e.target.value})} className="w-full text-[13px] px-4 py-3.5 outline-none rounded" style={{ background: 'transparent', border: `1px solid ${BORD}`, color: TEXT }} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold tracking-widest uppercase mb-2" style={{ color: SUB }}>Country</label>
                            <input required type="text" name="country" value={address.country} onChange={(e) => setAddress({...address, country: e.target.value})} className="w-full text-[13px] px-4 py-3.5 outline-none rounded" style={{ background: 'transparent', border: `1px solid ${BORD}`, color: TEXT }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: DELIVERY */}
                  {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h2 className="font-playfair text-2xl mb-8">Delivery Method</h2>
                      <div className="flex flex-col gap-4">
                        {deliveryOptions.map(opt => (
                          <div 
                            key={opt.id} 
                            onClick={() => setDelivery(opt.id)}
                            className="p-6 rounded-xl flex items-center cursor-pointer transition-all"
                            style={{ 
                              border: `1px solid ${delivery === opt.id ? ACC : BORD}`, 
                              background: delivery === opt.id ? 'rgba(212,175,55,0.05)' : 'transparent' 
                            }}
                          >
                            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-4" style={{ background: delivery === opt.id ? ACC : BORD }}>
                              <opt.icon size={20} style={{ color: delivery === opt.id ? '#000' : SUB }} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-[15px] mb-1">{opt.name}</h4>
                              <p className="text-[12px]" style={{ color: SUB }}>{opt.desc}</p>
                            </div>
                            <span className="font-medium">{opt.price === 0 ? 'Complimentary' : `+${formatPrice(opt.price)}`}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Luxury Packaging Toggle */}
                      <div className="mt-8 p-6 rounded-xl flex items-center justify-between" style={{ background: 'rgba(212,175,55,0.05)', border: `1px solid ${ACC}` }}>
                        <div className="flex items-center gap-4">
                          <Sparkles size={24} style={{ color: ACC }} />
                          <div>
                            <h4 className="font-medium text-[14px]">Signature Luxury Packaging</h4>
                            <p className="text-[12px]" style={{ color: SUB }}>Included complimentary with all orders.</p>
                          </div>
                        </div>
                        <CheckCircle2 size={20} style={{ color: ACC }} />
                      </div>
                      {/* AI: Complete the Collection panel */}
                      {(aiSuggestions.length > 0 || aiSuggestLoading) && (
                        <div className="mt-8 rounded-xl overflow-hidden" style={{ border: `1px solid ${BORD}`, background: isDark ? '#08080a' : '#fafafa' }}>
                          <button
                            onClick={() => setSuggestPanelOpen(o => !o)}
                            className="w-full flex items-center justify-between px-5 py-4"
                          >
                            <div className="flex items-center gap-2.5">
                              <Sparkles size={14} style={{ color: ACC }} />
                              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: ACC }}>Complete the Collection</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-widest" style={{ color: SUB }}>
                              {suggestPanelOpen ? 'Hide' : 'Show'}
                            </span>
                          </button>

                          {suggestPanelOpen && (
                            <div className="px-5 pb-5">
                              {aiSuggestLoading ? (
                                <div className="flex gap-3">
                                  {[0,1,2].map(i => <div key={i} className="flex-1 h-24 rounded-lg animate-pulse" style={{ background: isDark ? '#111' : '#eee' }} />)}
                                </div>
                              ) : (
                                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                                  {aiSuggestions.map(p => (
                                    <div key={p._id} className="shrink-0 w-[180px] rounded-lg overflow-hidden" style={{ border: `1px solid ${BORD}`, background: isDark ? '#111' : '#fff' }}>
                                      <div className="h-28 flex items-center justify-center p-3" style={{ background: isDark ? '#0d0d0d' : '#f5f0e8' }}>
                                        <img src={p.images?.[0]?.url} alt={p.name} className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                                      </div>
                                      <div className="p-3">
                                        <p className="text-[8px] uppercase tracking-widest mb-0.5" style={{ color: SUB }}>{p.brand}</p>
                                        <p className="text-[11px] font-playfair truncate mb-1" style={{ color: TEXT }}>{p.name}</p>
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-medium" style={{ color: TEXT }}>{formatPrice(p.discountPrice || p.price)}</span>
                                          <button
                                            type="button"
                                            onClick={() => addToCart(p, 1)}
                                            disabled={!p.stock}
                                            className="text-[8px] px-2 py-1 rounded font-bold uppercase tracking-wider transition-colors disabled:opacity-30"
                                            style={{ background: ACC, color: '#000' }}
                                          >
                                            Add
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-[9px] mt-3 uppercase tracking-widest" style={{ color: SUB }}>
                                You qualify for complimentary signature packaging with this order.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 3: PAYMENT */}
                  {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h2 className="font-playfair text-2xl mb-8">Payment Method</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {paymentOptions.map(opt => (
                          <div 
                            key={opt.id} 
                            onClick={() => setPayment(opt.id)}
                            className="p-6 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-4"
                            style={{ 
                              border: `1px solid ${payment === opt.id ? ACC : BORD}`, 
                              background: payment === opt.id ? 'rgba(212,175,55,0.05)' : 'transparent' 
                            }}
                          >
                            <opt.icon size={24} style={{ color: payment === opt.id ? ACC : SUB }} />
                            <span className="text-[12px] font-medium">{opt.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-6 rounded-xl" style={{ border: `1px solid ${BORD}` }}>
                        <p className="text-center text-[12px] leading-relaxed" style={{ color: SUB }}>
                          You will be redirected to the secure payment gateway in the final step. NexORA uses 256-bit encryption. We never store your card details.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: REVIEW */}
                  {step === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                      <h2 className="font-playfair text-2xl mb-8">Review Order</h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div>
                          <h4 className="text-[10px] font-bold tracking-widest uppercase mb-4" style={{ color: SUB }}>Shipping To</h4>
                          <p className="text-[14px] leading-relaxed">
                            {address.street}<br/>
                            {address.city}, {address.state} {address.zip}<br/>
                            {address.country}
                          </p>
                          <button type="button" onClick={() => setStep(1)} className="text-[11px] font-bold uppercase mt-4 hover:underline" style={{ color: ACC }}>Edit</button>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold tracking-widest uppercase mb-4" style={{ color: SUB }}>Delivery & Payment</h4>
                          <p className="text-[14px] leading-relaxed capitalize">
                            {deliveryOptions.find(d=>d.id===delivery)?.name}<br/>
                            {paymentOptions.find(p=>p.id===payment)?.name}
                          </p>
                          <button type="button" onClick={() => setStep(2)} className="text-[11px] font-bold uppercase mt-4 hover:underline" style={{ color: ACC }}>Edit</button>
                        </div>
                      </div>

                      <div className="border-t pt-8" style={{ borderColor: BORD }}>
                        <h4 className="text-[10px] font-bold tracking-widest uppercase mb-6" style={{ color: SUB }}>Order Items</h4>
                        <div className="flex flex-col gap-4">
                          {cartItems.map(item => (
                            <div key={item._id} className="flex items-center gap-4">
                              <img loading="lazy" src={item.image} alt={item.name} className="w-16 h-16 object-contain rounded" style={{ background: isDark ? '#111' : '#F2EDE4' }}  onError={(e) => {
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }} />
                              <div className="flex-1">
                                <p className="text-[13px] font-medium truncate">{item.name}</p>
                                <p className="text-[11px]" style={{ color: SUB }}>Qty: {item.quantity}</p>
                              </div>
                              <span className="text-[14px] font-medium">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className="lg:col-span-5">
            <div className="p-8 rounded-[24px] sticky top-32" style={{ background: SURF, border: `1px solid ${BORD}` }}>
              <h2 className="font-playfair text-2xl mb-8">Summary</h2>
              
              <div className="flex flex-col gap-4 text-[13px] mb-8 pb-8" style={{ color: SUB, borderBottom: `1px solid ${BORD}` }}>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span style={{ color: TEXT }}>{formatPrice(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span style={{ color: shippingPrice === 0 ? ACC : TEXT }}>
                    {shippingPrice === 0 ? 'Complimentary' : formatPrice(shippingPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (15%)</span>
                  <span style={{ color: TEXT }}>{formatPrice(taxPrice)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span>Discount ({appliedDiscountCode})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
              </div>

              {/* Discount Input */}
              <div className="mb-8">
                {appliedDiscountCode ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-green-500" />
                      <span className="text-[12px] font-bold tracking-widest text-green-500 uppercase">{appliedDiscountCode}</span>
                      <span className="text-[11px] text-green-400">applied — saving {formatPrice(discountAmount)}</span>
                    </div>
                    <button type="button" onClick={handleRemoveDiscount} className="text-[11px] text-gray-400 hover:text-red-400 transition-colors font-medium">Remove</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={discountCodeInput} 
                      onChange={(e) => setDiscountCodeInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
                      placeholder="Gift card or discount code" 
                      className="flex-1 text-[13px] px-4 py-3 outline-none rounded" 
                      style={{ background: 'transparent', border: `1px solid ${BORD}`, color: TEXT }} 
                    />
                    <button 
                      type="button" 
                      onClick={handleApplyDiscount} 
                      disabled={discountLoading || !discountCodeInput.trim()}
                      className="px-6 py-3 text-[12px] font-bold uppercase rounded disabled:opacity-50 transition-colors"
                      style={{ background: BORD, color: TEXT }}
                    >
                      {discountLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {discountError && <p className="text-red-500 text-[11px] mt-2">{discountError}</p>}
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="text-[14px] font-medium">Total</span>
                <span className="text-3xl font-medium tracking-tight">{formatPrice(finalTotal)}</span>
              </div>

              <button 
                type="submit" form="checkout-form" disabled={loading}
                className="w-full py-4 text-[12px] font-bold tracking-widest uppercase transition-opacity hover:opacity-90 flex items-center justify-center gap-3 disabled:opacity-50" 
                style={{ background: ACC, color: '#000', borderRadius: 4 }}
              >
                {loading ? 'Processing...' : step === 4 ? 'Confirm Payment' : 'Continue'} 
                {!loading && <ArrowRight size={16} />}
              </button>

              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="w-full mt-4 py-4 text-[11px] font-bold tracking-widest uppercase hover:underline" style={{ color: SUB }}>
                  Back
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
