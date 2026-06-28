// NexORA V7 — Luxury Navbar & Search Modal

import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, User, LogOut, Menu, X, LayoutDashboard, Package, Sun, Moon, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { useWishlist } from '@context/WishlistContext';
import { useTheme } from '@context/ThemeContext';
import MainLogo from '@components/common/MainLogo';
import GoldCartIcon from '@components/common/GoldCartIcon';
import { productService } from '@services/productService';
import { categoryService } from '@services/categoryService';

/* ── THEME TOGGLE ── */
const ThemeToggle = ({ isDark, toggleTheme }) => (
  <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: isDark ? '#D4AF37' : '#C9A96E' }}>
    {isDark ? <Sun size={16} /> : <Moon size={16} />}
  </button>
);

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  // Luxury Search Modal
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch initial search data
  useEffect(() => {
    if (searchOpen && trending.length === 0) {
      productService.getAll({ limit: 4, sort: '-ratings.average' }).then(res => setTrending(res.data.data.products || []));
      categoryService.getAll().then(res => setCategories(res.data.data || []));
    }
    if (searchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [searchOpen]);

  // Live Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      productService.getAll({ keyword: searchQuery, limit: 4 }).then(res => setSearchResults(res.data.data.products || []));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const SURF = isDark ? 'rgba(11,11,11,0.85)' : 'rgba(255,255,255,0.9)';
  const BORD = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const TEXT = isDark ? '#FFFFFF' : '#111827';
  const SUB  = isDark ? '#9CA3AF' : '#6B7280';
  const ACC  = isDark ? '#D4AF37' : '#C9A96E';

  const NavLinkItem = ({ to, label }) => (
    <NavLink to={to} className={({ isActive }) => `relative px-4 py-2 text-[12px] font-bold tracking-widest uppercase transition-colors ${isActive ? `text-[${ACC}]` : `text-[${SUB}] hover:text-[${TEXT}]`}`}>
      {({ isActive }) => (
        <>
          <span className="relative z-10">{label}</span>
          {isActive && <motion.div layoutId="navDot" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: ACC }} />}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      <motion.header 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.8 }}
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-4' : 'py-8'}`}
      >
        <div className="container-app">
          <div 
            className="flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500"
            style={{ 
              background: scrolled ? SURF : 'transparent',
              backdropFilter: scrolled ? 'blur(20px)' : 'none',
              border: scrolled ? `1px solid ${BORD}` : '1px solid transparent',
              boxShadow: scrolled ? (isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.05)') : 'none'
            }}
          >
            {/* ── LEFT: Logo ── */}
            <Link to="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity">
              <MainLogo className="w-8 h-8" showText={true} textClassName="text-xl font-playfair tracking-wider ml-3 hidden sm:block" layout="horizontal" />
            </Link>

            {/* ── CENTER: Links ── */}
            <div className="hidden lg:flex items-center">
              <NavLinkItem to="/" label="Discover" />
              <NavLinkItem to="/products" label="Collections" />
              <NavLinkItem to="/concierge" label="Concierge" />
            </div>

            {/* ── RIGHT: Actions ── */}
            <div className="flex items-center gap-2">
              <button onClick={() => setSearchOpen(true)} className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: SUB }}>
                <Search size={18} />
              </button>

              <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} />

              {/* V13: Universal AI Concierge button — accessible from every page */}
              <button
                onClick={() => navigate('/concierge')}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-bold tracking-[0.18em] uppercase transition-all duration-300 hover:scale-105 ${
                  location.pathname === '/concierge' ? 'opacity-40 pointer-events-none' : ''
                }`}
                style={{
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))',
                  border: '1px solid rgba(212,175,55,0.35)',
                  color: '#D4AF37',
                }}
                title="AI Concierge"
              >
                <Sparkles size={9} />
                <span className="hidden md:inline">Concierge</span>
              </button>

              <Link to="/wishlist" className="relative p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: SUB }}>
                <Heart size={18} />
                {wishlistCount > 0 && <span className="absolute top-1 right-0 w-3.5 h-3.5 text-[9px] font-bold rounded-full flex items-center justify-center text-black" style={{ background: ACC }}>{wishlistCount}</span>}
              </Link>

              <Link to="/cart" className="relative p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: SUB }}>
                <GoldCartIcon size={46} />
                {itemCount > 0 && <span className="absolute top-1 right-0 w-3.5 h-3.5 text-[9px] font-bold rounded-full flex items-center justify-center text-black" style={{ background: ACC }}>{itemCount}</span>}
              </Link>

              {/* Auth Profile */}
              {isAuthenticated ? (
                <div className="relative ml-2">
                  <button onClick={() => setProfileOpen(!profileOpen)} className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-transform hover:scale-105" style={{ background: isDark ? '#222' : '#EEE', color: TEXT, border: `1px solid ${BORD}` }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-4 w-56 rounded-2xl overflow-hidden shadow-2xl py-2" style={{ background: isDark ? '#111' : '#FFF', border: `1px solid ${BORD}` }}>
                        <div className="px-5 py-3 border-b" style={{ borderColor: BORD }}>
                          <p className="text-[13px] font-bold truncate" style={{ color: TEXT }}>{user?.name}</p>
                          <p className="text-[11px] truncate" style={{ color: SUB }}>{user?.email}</p>
                        </div>
                        {isAdmin && (
                          <Link to="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[12px] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: TEXT }}>
                            <LayoutDashboard size={14} style={{ color: ACC }} /> Executive Admin
                          </Link>
                        )}
                        <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[12px] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: TEXT }}>
                          <User size={14} style={{ color: SUB }} /> My Profile
                        </Link>
                        <Link to="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[12px] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: TEXT }}>
                          <Package size={14} style={{ color: SUB }} /> My Orders
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 text-[12px] font-medium transition-colors text-red-500 hover:bg-red-500/10 border-t" style={{ borderColor: BORD }}>
                          <LogOut size={14} /> Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/login" className="ml-2 px-5 py-2 text-[10px] font-bold tracking-widest uppercase rounded-full transition-transform hover:scale-105" style={{ background: ACC, color: '#000' }}>
                  Sign In
                </Link>
              )}

              {/* Mobile Toggle */}
              <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 ml-2" style={{ color: SUB }}>
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ══════════════════════════════
          LUXURY SEARCH MODAL
      ══════════════════════════════ */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSearchOpen(false)} />
            
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} transition={{ duration: 0.4 }} className="relative w-full max-w-4xl rounded-[24px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]" style={{ background: isDark ? '#0B0B0B' : '#FFFFFF', border: `1px solid ${BORD}` }}>
              
              {/* Search Header */}
              <div className="p-6 md:p-8 border-b relative" style={{ borderColor: BORD }}>
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <Search size={24} style={{ color: ACC }} className="absolute left-0" />
                  <input 
                    ref={searchInputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search collections, products, or brands..." 
                    className="w-full bg-transparent text-xl md:text-2xl font-playfair outline-none pl-12 pr-12"
                    style={{ color: TEXT }}
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="absolute right-0 p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: SUB }}>
                    <X size={20} />
                  </button>
                </form>
              </div>

              {/* Search Body */}
              <div className="flex-1 overflow-y-auto lux-scroll p-6 md:p-8">
                {searchQuery.trim() && searchResults.length > 0 ? (
                  <div>
                    <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: SUB }}>Product Results</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {searchResults.map(p => (
                        <Link key={p._id} to={`/product/${p.slug}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-4 p-4 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ border: `1px solid ${BORD}` }}>
                          <div className="w-16 h-16 rounded overflow-hidden shrink-0" style={{ background: isDark ? '#111' : '#F2EDE4' }}>
                            <img src={p.images[0]?.url} alt="" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold tracking-[0.2em] uppercase mb-1" style={{ color: ACC }}>{p.brand}</p>
                            <h5 className="font-playfair text-[15px] mb-1 truncate">{p.name}</h5>
                            <span className="text-[12px] font-medium">${p.discountPrice || p.price}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : searchQuery.trim() && searchResults.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-[14px]" style={{ color: SUB }}>No products found matching &quot;{searchQuery}&quot;</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Trending */}
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: SUB }}>
                        <TrendingUp size={12} style={{ color: ACC }} /> Trending Now
                      </h4>
                      <div className="flex flex-col gap-4">
                        {trending.map((t, i) => (
                          <Link key={t._id} to={`/product/${t.slug}`} onClick={() => setSearchOpen(false)} className="flex items-center gap-4 group">
                            <span className="text-[14px] font-playfair font-bold w-4 text-center" style={{ color: SUB }}>{i+1}</span>
                            <div className="w-12 h-12 rounded overflow-hidden shrink-0" style={{ background: isDark ? '#111' : '#F2EDE4' }}>
                              <img src={t.images[0]?.url} alt="" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                              <h5 className="font-playfair text-[14px] group-hover:text-[#D4AF37] transition-colors">{t.name}</h5>
                              <span className="text-[11px] font-medium" style={{ color: SUB }}>${t.discountPrice || t.price}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6" style={{ color: SUB }}>Popular Categories</h4>
                      <div className="flex flex-wrap gap-2">
                        {categories.slice(0, 8).map(c => (
                          <Link key={c._id} to={`/products?category=${c.slug}`} onClick={() => setSearchOpen(false)} className="px-4 py-2 rounded-full text-[12px] font-medium transition-colors hover:bg-[#D4AF37] hover:text-black" style={{ background: isDark ? '#111' : '#F2EDE4', color: TEXT }}>
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t flex justify-between items-center" style={{ borderColor: BORD, background: isDark ? '#111' : '#F8F6F1' }}>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: SUB }}>AI Enhanced Search</span>
                <Sparkles size={14} style={{ color: ACC }} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════
          MOBILE DRAWER
      ══════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[110] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.4 }} className="absolute top-0 right-0 bottom-0 w-4/5 max-w-sm flex flex-col shadow-2xl" style={{ background: SURF, borderLeft: `1px solid ${BORD}` }}>
              <div className="p-6 flex justify-between items-center border-b" style={{ borderColor: BORD }}>
                <MainLogo className="w-8 h-8" showText={true} layout="horizontal" />
                <button onClick={() => setMobileOpen(false)}><X size={24} style={{ color: TEXT }} /></button>
              </div>
              <div className="flex-1 flex flex-col p-8 gap-6">
                <Link to="/" onClick={() => setMobileOpen(false)} className="font-playfair text-2xl">Discover</Link>
                <Link to="/products" onClick={() => setMobileOpen(false)} className="font-playfair text-2xl">Collections</Link>
                <Link to="/concierge" onClick={() => setMobileOpen(false)} className="font-playfair text-2xl" style={{ color: ACC }}>AI Concierge</Link>
              </div>
              <div className="p-8 border-t flex flex-col gap-4" style={{ borderColor: BORD }}>
                {!isAuthenticated ? (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full py-4 text-center text-[11px] font-bold tracking-widest uppercase rounded" style={{ background: ACC, color: '#000' }}>Sign In</Link>
                ) : (
                  <>
                    <p className="text-[12px] font-bold mb-2">Signed in as {user?.name}</p>
                    {isAdmin && <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-[14px]">Admin Dashboard</Link>}
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="text-[14px]">My Profile</Link>
                    <button onClick={handleLogout} className="text-left text-[14px] text-red-500 mt-2">Sign Out</button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
