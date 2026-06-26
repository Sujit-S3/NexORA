// NexORA V7 — Luxury Products Page

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Star, X, Eye, Heart, ShoppingBag, ChevronRight, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { productService } from '@services/productService';
import { categoryService } from '@services/categoryService';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { getLuxuryFallback } from '../utils/getLuxuryFallback';
import { formatPrice } from '../utils/formatPrice';

/* ─── HELPER COMPONENTS ────────────────────────────────────── */

const NOrbSmall = ({ size = 64 }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
    <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 70%)', animation: 'goldPulse 3s ease-in-out infinite' }} />
    <div className="absolute rounded-full border border-[#D4AF37]/45" style={{ inset: -4, animation: 'orbSpin 8s linear infinite' }} />
    <div
      className="relative rounded-full flex items-center justify-center"
      style={{
        width: size * 0.75, height: size * 0.75,
        background: 'linear-gradient(145deg, rgba(212,175,55,0.15) 0%, rgba(5,5,5,0.92) 100%)',
        border: '1.5px solid rgba(212,175,55,0.6)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <span className="font-playfair font-semibold text-[#D4AF37]" style={{ fontSize: size * 0.35 }}>N</span>
    </div>
  </div>
);

/* ─── MAIN COMPONENT ───────────────────────────────────────── */

export default function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);

  // Filter State
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'createdAt:desc');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [isFeatured, setIsFeatured] = useState(searchParams.get('isFeatured') === 'true');
  const [isNewArrival, setIsNewArrival] = useState(searchParams.get('isNewArrival') === 'true');

  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  // Colors
  const BG   = isDark ? '#050505' : 'transparent';
  const SURF = isDark ? '#0B0B0B' : '#FFFFFF';
  const BORD = isDark ? '#1A1A1A' : '#E8E2D9';
  const TEXT = isDark ? '#FFFFFF' : '#111111';
  const SUB  = isDark ? '#9CA3AF' : '#6B7280';
  const ACC  = isDark ? '#D4AF37' : '#C9A96E';

  // Fetch Logic
  useEffect(() => {
    categoryService.getAll().then(res => setCategories(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = Object.fromEntries([...searchParams]);
        const res = await productService.getAll(params);
        setProducts(res.data.data.products || []);
        setPages(res.data.data.pagination?.pages || 1);
        setPage(res.data.data.pagination?.page || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchParams]);

  const updateParams = (newParams) => {
    const current = Object.fromEntries([...searchParams]);
    const merged = { ...current, ...newParams };
    Object.keys(merged).forEach(k => { if (!merged[k]) delete merged[k]; });
    setSearchParams(merged);
  };

  const handleApplyFilters = () => {
    updateParams({ keyword, category, sort, minPrice, maxPrice, isFeatured, isNewArrival, page: 1 });
    setShowFiltersMobile(false);
  };

  const clearFilters = () => {
    setKeyword(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setIsFeatured(false); setIsNewArrival(false);
    updateParams({ keyword: '', category: '', sort: 'createdAt:desc', minPrice: '', maxPrice: '', isFeatured: '', isNewArrival: '', page: 1 });
  };

  return (
    <div className="min-h-screen font-jakarta pb-20" style={{ background: BG, color: TEXT }}>
      
      <style>{`
        @keyframes orbSpin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes goldPulse { 0%,100% { opacity:.3; transform:scale(1); } 50% { opacity:.6; transform:scale(1.06); } }
        .lux-scroll::-webkit-scrollbar { width: 4px; }
        .lux-scroll::-webkit-scrollbar-track { background: transparent; }
        .lux-scroll::-webkit-scrollbar-thumb { background: ${BORD}; border-radius: 4px; }
      `}</style>

      {/* ══════════════════════════════
          1 · HERO BANNER
      ══════════════════════════════ */}
      <section className="relative w-full overflow-hidden flex items-center pt-24" style={{ height: 420 }}>
        {/* Ambient Gradient */}
        <div className="absolute inset-0 z-0" style={{
          background: isDark 
            ? 'linear-gradient(180deg, rgba(5,5,5,0) 0%, #050505 100%), radial-gradient(ellipse at 50% 30%, rgba(212,175,55,0.12) 0%, transparent 60%)'
            : 'linear-gradient(180deg, rgba(248,246,241,0) 0%, transparent 100%), radial-gradient(ellipse at 50% 30%, rgba(201,169,110,0.15) 0%, transparent 60%)'
        }} />

        <div className="container-app relative z-10 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-6" style={{ color: ACC }}>
              The Collection
            </p>
            <h1 className="font-playfair leading-[1.1] tracking-tight mb-6" style={{ fontSize: 'clamp(40px, 4.5vw, 64px)' }}>
              Curated Luxury.<br />
              Selected For Modern Living.
            </h1>
            <p className="text-[14px] leading-relaxed max-w-[500px] mx-auto mb-8 font-light" style={{ color: SUB }}>
              Explore premium fashion, watches, electronics, accessories, lifestyle products and luxury gifts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════
          2 · MAIN LAYOUT (SIDEBAR + GRID)
      ══════════════════════════════ */}
      <section className="container-app flex flex-col lg:flex-row gap-10 mt-8 relative">
        
        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between border-b pb-4" style={{ borderColor: BORD }}>
          <span className="text-[14px] font-playfair font-medium">{products.length} Products</span>
          <button onClick={() => setShowFiltersMobile(true)} className="flex items-center gap-2 text-[12px] font-bold tracking-widest uppercase" style={{ color: ACC }}>
            <SlidersHorizontal size={14} /> Filters
          </button>
        </div>

        {/* ── SIDEBAR ── */}
        <aside className={`fixed inset-0 z-50 lg:static lg:block lg:w-1/4 shrink-0 transition-opacity duration-300 ${showFiltersMobile ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}`}>
          {/* Mobile backdrop */}
          <div className="absolute inset-0 bg-black/60 lg:hidden" onClick={() => setShowFiltersMobile(false)} />
          
          <div className="relative w-[320px] lg:w-full h-full lg:h-auto max-h-screen lg:max-h-[calc(100vh-120px)] overflow-y-auto lux-scroll lg:sticky lg:top-24 p-6 lg:p-8"
            style={{ 
              background: isDark ? 'rgba(11,11,11,0.7)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${BORD}`,
              borderRadius: 20,
              boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-center justify-between lg:hidden mb-6">
              <h3 className="font-playfair text-xl">Filters</h3>
              <button onClick={() => setShowFiltersMobile(false)}><X size={20} /></button>
            </div>

            {/* Keyword Search */}
            <div className="mb-8">
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: SUB }}>Search</h4>
              <div className="relative">
                <input 
                  type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') updateParams({ keyword, page: 1 }); }}
                  placeholder="Find products..." 
                  className="w-full text-[13px] px-4 py-3 pl-10 outline-none transition-colors"
                  style={{ background: 'transparent', border: `1px solid ${BORD}`, borderRadius: 4, color: TEXT }}
                />
                <Search size={14} className="absolute left-4 top-3.5" style={{ color: SUB }} />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-8">
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: SUB }}>Category</h4>
              <div className="flex flex-col gap-2">
                <button onClick={() => { setCategory(''); updateParams({ category: '', page: 1 }); }} className={`text-left text-[13px] transition-colors ${!category ? 'font-medium' : ''}`} style={{ color: !category ? ACC : SUB }}>
                  All Collections
                </button>
                {categories.map(c => (
                  <button key={c._id} onClick={() => { setCategory(c.slug); updateParams({ category: c.slug, page: 1 }); }} className={`text-left text-[13px] transition-colors ${category === c.slug ? 'font-medium' : ''}`} style={{ color: category === c.slug ? ACC : SUB }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="mb-8">
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: SUB }}>Price Range</h4>
              <div className="flex items-center gap-3">
                <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)}
                  className="w-full text-[13px] px-3 py-2 outline-none" style={{ background: 'transparent', border: `1px solid ${BORD}`, borderRadius: 4, color: TEXT }} />
                <span style={{ color: SUB }}>-</span>
                <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
                  className="w-full text-[13px] px-3 py-2 outline-none" style={{ background: 'transparent', border: `1px solid ${BORD}`, borderRadius: 4, color: TEXT }} />
              </div>
            </div>

            {/* Flags */}
            <div className="mb-8">
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: SUB }}>Availability</h4>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 flex items-center justify-center transition-colors" style={{ border: `1px solid ${isFeatured ? ACC : BORD}`, background: isFeatured ? ACC : 'transparent', borderRadius: 2 }}>
                    {isFeatured && <div className="w-2 h-2 bg-black" />}
                  </div>
                  <span className="text-[13px]" style={{ color: isFeatured ? TEXT : SUB }}>Featured</span>
                  <input type="checkbox" className="hidden" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-4 h-4 flex items-center justify-center transition-colors" style={{ border: `1px solid ${isNewArrival ? ACC : BORD}`, background: isNewArrival ? ACC : 'transparent', borderRadius: 2 }}>
                    {isNewArrival && <div className="w-2 h-2 bg-black" />}
                  </div>
                  <span className="text-[13px]" style={{ color: isNewArrival ? TEXT : SUB }}>New Arrivals</span>
                  <input type="checkbox" className="hidden" checked={isNewArrival} onChange={e => setIsNewArrival(e.target.checked)} />
                </label>
              </div>
            </div>

            {/* Sort */}
            <div className="mb-8">
              <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-4" style={{ color: SUB }}>Sort By</h4>
              <select value={sort} onChange={e => setSort(e.target.value)} className="w-full text-[13px] px-3 py-2 outline-none appearance-none cursor-pointer" style={{ background: 'transparent', border: `1px solid ${BORD}`, borderRadius: 4, color: TEXT }}>
                <option value="createdAt:desc" className="bg-[#050505] text-white">Newest Arrivals</option>
                <option value="price_asc" className="bg-[#050505] text-white">Price: Low to High</option>
                <option value="price_desc" className="bg-[#050505] text-white">Price: High to Low</option>
                <option value="top_rated" className="bg-[#050505] text-white">Top Rated</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-4" style={{ borderTop: `1px solid ${BORD}` }}>
              <button onClick={handleApplyFilters} className="w-full py-3 text-[11px] font-bold tracking-widest uppercase transition-opacity hover:opacity-90" style={{ background: ACC, color: '#000', borderRadius: 2 }}>
                Apply Filters
              </button>
              <button onClick={clearFilters} className="w-full py-3 text-[11px] font-bold tracking-widest uppercase transition-opacity" style={{ background: 'transparent', border: `1px solid ${BORD}`, color: TEXT, borderRadius: 2 }}>
                Clear All
              </button>
            </div>
          </div>
        </aside>

        {/* ── PRODUCT GRID ── */}
        <div className="flex-1 w-full lg:w-3/4">
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-[20px]" style={{ height: 520, background: SURF, border: `1px solid ${BORD}` }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center" style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 24 }}>
              <div className="w-16 h-16 mb-6 flex items-center justify-center rounded-full" style={{ background: 'rgba(212,175,55,0.1)' }}>
                <Search size={24} style={{ color: ACC }} />
              </div>
              <h3 className="font-playfair text-2xl mb-3">No results found</h3>
              <p className="text-[14px] max-w-sm mb-6" style={{ color: SUB }}>We couldn't find any products matching your current filters. Try adjusting your search criteria.</p>
              <button onClick={clearFilters} className="px-6 py-3 text-[11px] font-bold tracking-widest uppercase transition-opacity hover:opacity-90" style={{ background: ACC, color: '#000', borderRadius: 2 }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Top Bar Desktop */}
              <div className="hidden lg:flex justify-between items-end mb-8 border-b pb-4" style={{ borderColor: BORD }}>
                <p className="text-[13px] font-medium" style={{ color: SUB }}>Showing <span style={{ color: TEXT }}>{products.length}</span> results</p>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                <AnimatePresence>
                  {products.map((product, i) => (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      key={product._id}
                      className="group relative flex flex-col overflow-hidden"
                      style={{ height: 520, background: SURF, border: `1px solid ${BORD}`, borderRadius: 20 }}
                    >
                      {/* Image Area - 75% height */}
                      <div className="relative w-full overflow-hidden flex items-center justify-center p-6" style={{ height: '70%', background: isDark ? '#111' : '#F2EDE4' }}>
                        {/* Badges */}
                        <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                          {product.isNewArrival && (
                            <span className="text-[8px] font-bold tracking-[0.2em] uppercase px-2.5 py-1" style={{ background: 'rgba(212,175,55,0.15)', color: ACC }}>NEW</span>
                          )}
                          {product.stock === 0 && (
                            <span className="text-[8px] font-bold tracking-[0.2em] uppercase px-2.5 py-1" style={{ background: 'rgba(255,0,0,0.1)', color: '#EF4444' }}>SOLD OUT</span>
                          )}
                        </div>

                        {/* Image */}
                        <img loading="lazy" 
                          src={product.images[0]?.url} 
                          alt={product.name}
                          className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                          style={{ mixBlendMode: isDark ? 'normal' : 'multiply' }}
                         onError={(e) => {
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }} />

                        {/* Hover Overlay Controls */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center gap-4">
                          <button 
                            onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isInWishlist(product._id) ? 'bg-white text-[#D4AF37]' : 'bg-white/10 hover:bg-white/20 text-white hover:text-[#D4AF37]'}`}
                          >
                            <Heart size={16} fill={isInWishlist(product._id) ? '#D4AF37' : 'none'} />
                          </button>
                          <button 
                            onClick={(e) => { e.preventDefault(); setQuickViewProduct(product); }}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all text-white hover:text-[#D4AF37]"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.preventDefault(); 
                              if (product.stock > 0 && product.isActive) addToCart(product, 1); 
                            }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${product.stock === 0 || !product.isActive ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-[#D4AF37] hover:bg-[#B38945] text-black'}`}
                            disabled={product.stock === 0 || !product.isActive}
                            title={product.stock === 0 ? "Out of Stock" : !product.isActive ? "Currently Unavailable" : "Add to Cart"}
                          >
                            <ShoppingBag size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Info Area - 25% height */}
                      <Link to={`/product/${product.slug}`} className="flex-1 flex flex-col justify-center px-5 py-4 z-20">
                        <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5" style={{ color: SUB }}>{product.brand}</p>
                        <h3 className="text-[14px] font-playfair font-medium leading-tight mb-2 truncate group-hover:text-[#D4AF37] transition-colors">{product.name}</h3>
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-2">
                            {product.discountPrice ? (
                            <div className="flex items-center gap-3">
                                <span className="text-[13px] font-medium" style={{ color: ACC }}>{formatPrice(product.discountPrice)}</span>
                                <span className="text-[11px] line-through" style={{ color: SUB }}>{formatPrice(product.price)}</span>
                            </div>
                          ) : (
                              <span className="text-[13px] font-medium">{formatPrice(product.price)}</span>
                          )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star size={10} fill={ACC} style={{ color: ACC }} />
                            <span className="text-[11px] font-medium mt-0.5">{product.ratings?.average || '0.0'}</span>
                          </div>
                        </div>
                      </Link>

                      {/* Gold Glow Hover Effect */}
                      <div className="absolute inset-0 border border-transparent group-hover:border-[#D4AF37]/40 pointer-events-none transition-colors duration-500" style={{ borderRadius: 20 }} />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700" style={{ boxShadow: 'inset 0 0 40px rgba(212,175,55,0.08)', borderRadius: 20 }} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex justify-center mt-16 gap-2">
                  {[...Array(pages)].map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => updateParams({ page: idx + 1 })}
                      className="w-10 h-10 flex items-center justify-center text-[12px] font-medium transition-colors"
                      style={{ 
                        border: `1px solid ${page === idx + 1 ? ACC : BORD}`, 
                        background: page === idx + 1 ? ACC : 'transparent',
                        color: page === idx + 1 ? '#000' : TEXT,
                        borderRadius: 4
                      }}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* ══════════════════════════════
          3 · COLLECTION CALLOUT
      ══════════════════════════════ */}
      <section className="container-app mt-24">
        <div 
          className="relative w-full rounded-[24px] overflow-hidden flex flex-col md:flex-row items-center justify-between p-10 md:p-16 lg:p-20"
          style={{ background: '#0B0B0B', border: '1px solid #1A1A1A' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(212,175,55,0.1) 0%, transparent 60%)' }} />
          
          <div className="relative z-10 md:w-1/2 mb-10 md:mb-0 text-center md:text-left">
            <h2 className="font-playfair text-white leading-[1.1] mb-5" style={{ fontSize: 'clamp(28px, 3.5vw, 44px)' }}>
              Need Something Extraordinary?
            </h2>
            <p className="text-[14px] text-gray-400 max-w-md mx-auto md:mx-0">
              Discover exclusive collections curated by our AI Concierge based on your personal aesthetic and preferences.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
            <button onClick={() => navigate('/concierge')} className="px-7 py-3.5 text-[11px] font-bold tracking-widest uppercase transition-opacity hover:opacity-90 w-full sm:w-auto text-center" style={{ background: '#D4AF37', color: '#000', borderRadius: 2 }}>
              Talk To Concierge
            </button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-7 py-3.5 text-[11px] font-bold tracking-widest uppercase transition-colors w-full sm:w-auto text-center" style={{ border: '1px solid rgba(255,255,255,0.15)', color: '#FFF', borderRadius: 2 }}>
              Browse Collections
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          4 · QUICK VIEW MODAL
      ══════════════════════════════ */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setQuickViewProduct(null)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-full overflow-y-auto lux-scroll flex flex-col md:flex-row shadow-2xl"
              style={{ background: SURF, border: `1px solid ${BORD}`, borderRadius: 24 }}
            >
              <button onClick={() => setQuickViewProduct(null)} className="absolute top-5 right-5 z-20 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X size={20} />
              </button>

              {/* Image */}
              <div className="w-full md:w-1/2 p-8 lg:p-12 flex items-center justify-center" style={{ background: isDark ? '#111' : '#F2EDE4' }}>
                <img loading="lazy" src={quickViewProduct.images[0]?.url} alt={quickViewProduct.name} className="w-full h-auto object-contain max-h-[400px]" style={{ mixBlendMode: isDark ? 'normal' : 'multiply' }}  onError={(e) => {
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }} />
              </div>

              {/* Details */}
              <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: ACC }}>{quickViewProduct.brand}</p>
                <h2 className="font-playfair text-2xl lg:text-3xl mb-4 leading-tight">{quickViewProduct.name}</h2>
                <div className="flex items-center gap-3 mb-6">
                  {quickViewProduct.discountPrice ? (
                    <div className="flex items-end gap-4 mb-8">
                      <span className="text-xl font-medium" style={{ color: ACC }}>{formatPrice(quickViewProduct.discountPrice)}</span>
                      <span className="text-sm line-through" style={{ color: SUB }}>{formatPrice(quickViewProduct.price)}</span>
                    </div>
                  ) : (
                    <span className="text-xl font-medium mb-8 block">{formatPrice(quickViewProduct.price)}</span>
                  )}
                </div>
                <p className="text-[13px] leading-relaxed mb-8" style={{ color: SUB }}>
                  {quickViewProduct.description?.substring(0, 150)}...
                </p>
                
                <div className="flex gap-4 mt-auto">
                  <button 
                    onClick={() => { 
                      if (quickViewProduct.stock > 0 && quickViewProduct.isActive) {
                        addToCart(quickViewProduct, 1); 
                        setQuickViewProduct(null); 
                      }
                    }}
                    disabled={quickViewProduct.stock === 0 || !quickViewProduct.isActive}
                    className={`flex-1 py-4 text-[12px] font-bold tracking-widest uppercase transition-opacity flex items-center justify-center gap-3 rounded ${quickViewProduct.stock === 0 || !quickViewProduct.isActive ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'hover:opacity-90'}`}
                    style={quickViewProduct.stock > 0 && quickViewProduct.isActive ? { background: ACC, color: '#000' } : {}}
                  >
                    {quickViewProduct.stock === 0 ? 'Out of Stock' : !quickViewProduct.isActive ? 'Currently Unavailable' : (
                      <>
                        Add To Cart <ShoppingBag size={16} />
                      </>
                    )}
                  </button>
                  <button onClick={() => navigate(`/product/${quickViewProduct.slug}`)} className="px-6 flex items-center justify-center transition-colors" style={{ border: `1px solid ${BORD}`, borderRadius: 2, color: TEXT }}>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
