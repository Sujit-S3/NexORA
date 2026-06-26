// NexORA — Premium Wishlist Component

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useWishlist } from '@context/WishlistContext';
import { useCart } from '@context/CartContext';
import { formatPrice } from '../utils/formatPrice';
import { getLuxuryFallback } from '../utils/getLuxuryFallback';

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (product) => {
    // 1. Add to Cart
    const result = await addToCart(product, 1);
    
    // 2. Confirm success
    if (result && result.success) {
      // 3. Remove from Wishlist
      await removeFromWishlist(product._id);
      // 4. Navigate to cart or let UI naturally refresh
      navigate('/cart');
    } else {
      // Handle cart error (already shown by CartContext or we can alert)
      console.error("Move to Cart failed:", result?.message);
    }
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="bg-transparent min-h-screen pt-32 pb-20 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-10 glass-panel max-w-lg mx-auto"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] mb-4 tracking-tight">Your wishlist is empty</h2>
          <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-8">Save items you love and buy them when you're ready.</p>
          <Link to="/products" className="btn-premium bg-gradient-to-r from-[#D4AF37] to-[#B38945] border-none text-white">Explore Collections</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="section container-app pt-32 pb-20 min-h-screen">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight mb-2">My Wishlist</h1>
          <p className="text-[#6B7280] dark:text-[#9CA3AF]">{wishlistItems.length} curated {wishlistItems.length === 1 ? 'item' : 'items'}</p>
        </div>
        <button 
          onClick={clearWishlist}
          className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          Clear All
        </button>
      </div>
        
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence>
          {wishlistItems.map((product, idx) => (
            <motion.div
              key={product._id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="glass-panel p-4 flex flex-col group relative overflow-hidden rounded-[2rem] hover:border-[#D4AF37]/50 transition-colors duration-300"
            >
              <button 
                onClick={() => removeFromWishlist(product._id)}
                className="absolute top-6 right-6 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <Link to={`/product/${product.slug || product._id}`} className="relative h-64 mb-4 rounded-[1.5rem] overflow-hidden bg-white dark:bg-[#05070A]">
                <img loading="lazy" 
                  src={product.images?.[0]?.url || product.image || '/assets/luxury/bags/hermes_kelly.png'} 
                  alt={product.name} 
                  className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700 mix-blend-multiply dark:mix-blend-normal" 
                 onError={(e) => {
    let cat = 'default';
    try { if (typeof product !== 'undefined') cat = product?.category?.name || product?.category; } catch(err){}
    try { if (typeof item !== 'undefined' && cat === 'default') cat = item?.category?.name || item?.category; } catch(err){}
    try { if (typeof p !== 'undefined' && cat === 'default') cat = p?.category?.name || p?.category; } catch(err){}
    try { if (typeof r !== 'undefined' && cat === 'default') cat = r?.category?.name || r?.category; } catch(err){}
    try { if (typeof quickViewProduct !== 'undefined' && cat === 'default') cat = quickViewProduct?.category?.name || quickViewProduct?.category; } catch(err){}
    e.currentTarget.src = getLuxuryFallback(cat);
  }} />
              </Link>
              
              <div className="flex flex-col flex-1 justify-end">
                <h3 className="font-semibold text-lg text-[#111827] dark:text-[#F5F5F5] truncate mb-1">{product.name}</h3>
                <span className="text-[#D4AF37] font-bold text-xl mb-4">{formatPrice(product.price || 0)}</span>
                
                {product.stock === 0 || product.isActive === false ? (
                  <button 
                    disabled
                    className="w-full btn-glass py-3 flex items-center justify-center gap-2 group/btn opacity-50 cursor-not-allowed"
                  >
                    <span>Currently Unavailable</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAddToCart(product)}
                    className="w-full btn-glass py-3 flex items-center justify-center gap-2 group/btn"
                  >
                    <ShoppingBag className="w-4 h-4" /> 
                    <span>Add to Cart</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wishlist;
