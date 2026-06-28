import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  GitCompare,
  Heart,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLuxuryFallback } from '../../utils/getLuxuryFallback';
import { formatPrice } from '../../utils/formatPrice';
import { getProductImage } from './utils';

function LuxuryProductCard({
  index = 0,
  inCompare = false,
  isWishlisted = false,
  onAddCart,
  onCompare,
  onFindSimilar,
  onQuickView,
  onToggleWishlist,
  product,
}) {
  const matchScore = Math.round(product?.matchScore || product?.score || product?.match || 0);
  const image = getProductImage(product, getLuxuryFallback);
  const availability = product?.availability || ((product?.stock || 0) > 0 ? 'In stock' : 'Sold out');
  const collection = product?.collection || product?.category?.name || 'Luxury collection';
  const rating = Number(product?.ratings?.average || product?.rating || 5);
  const luxuryNotes = useMemo(() => {
    const notes = [
      product?.reasonBadge,
      product?.luxuryNotes,
      product?.material ? `${product.material} finish` : null,
      product?.isBestSeller ? 'Best seller' : null,
      product?.isNewArrival ? 'New arrival' : null,
    ].filter(Boolean);

    return notes.slice(0, 3);
  }, [product]);

  const addToCart = () => {
    onAddCart?.(product, 1, product?.variants?.length > 0 ? product.variants[0].size : '');
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.32, ease: 'easeOut' }}
      className="group flex min-h-[520px] w-[292px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_18px_55px_rgba(15,15,15,0.08)] transition-all hover:-translate-y-0.5 hover:border-[#D4AF37]/50 hover:shadow-[0_22px_65px_rgba(15,15,15,0.12)] dark:border-[#1A1A1A] dark:bg-[#090909]"
    >
      <div className="relative flex h-56 items-center justify-center overflow-hidden border-b border-gray-100 bg-[#F8F7F3] dark:border-[#1A1A1A] dark:bg-[#111]">
        {matchScore > 0 && (
          <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-black/75 px-2.5 py-1 text-[10px] font-bold text-[#D4AF37] backdrop-blur">
            <Sparkles size={10} />
            {matchScore}% match
          </div>
        )}
        <button
          type="button"
          onClick={() => onToggleWishlist?.(product)}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white/90 text-gray-500 backdrop-blur transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37] dark:border-white/10 dark:bg-black/60"
          title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart size={14} fill={isWishlisted ? '#D4AF37' : 'none'} className={isWishlisted ? 'text-[#D4AF37]' : ''} />
        </button>
        <motion.img
          src={image}
          alt={product?.name}
          loading="lazy"
          className="h-full w-full object-contain p-5"
          whileHover={{ scale: 1.045 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          onError={event => {
            const catName = typeof product?.category === 'object' ? product?.category?.name : product?.category;
            event.currentTarget.src = getLuxuryFallback(catName);
          }}
        />
        {(product?.stock || 0) <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rounded-full border border-red-300/30 bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300">
              Sold out
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">{product?.brand || 'NexORA'}</p>
            <h3 className="mt-1 line-clamp-2 font-playfair text-[17px] leading-tight text-black transition-colors group-hover:text-[#B38945] dark:text-white">
              {product?.name}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-[#D4AF37]/20 px-2 py-1 text-[10px] text-[#D4AF37]">
            <Star size={10} fill="#D4AF37" />
            {Number.isFinite(rating) ? rating.toFixed(1) : '5.0'}
          </div>
        </div>

        <p className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]/80">{collection}</p>

        <div className="my-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[20px] font-light text-black dark:text-white">{formatPrice(product?.discountPrice || product?.price || 0)}</p>
            {product?.discountPrice && product?.price && product.discountPrice < product.price && (
              <p className="text-[10px] text-gray-500 line-through">{formatPrice(product.price)}</p>
            )}
          </div>
          <span className={(product?.stock || 0) > 0 ? 'text-[10px] font-semibold text-emerald-500' : 'text-[10px] font-semibold text-red-400'}>
            {availability}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500">
          <div className="rounded-xl border border-gray-200 px-2.5 py-2 dark:border-[#1A1A1A]">
            <ShieldCheck size={12} className="mb-1 text-[#D4AF37]" />
            {product?.warranty || 'Authenticity verified'}
          </div>
          <div className="rounded-xl border border-gray-200 px-2.5 py-2 dark:border-[#1A1A1A]">
            <PackageCheck size={12} className="mb-1 text-[#D4AF37]" />
            {product?.delivery || product?.deliveryEstimate || 'Priority delivery'}
          </div>
        </div>

        {luxuryNotes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {luxuryNotes.map(note => (
              <span key={note} className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-1 text-[9px] text-[#B38945] dark:text-[#D4AF37]">
                {note}
              </span>
            ))}
          </div>
        )}

        {(product?.aiExplanation || product?.recommendationReason) && (
          <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">
            {product.aiExplanation || product.recommendationReason}
          </p>
        )}

        <div className="mt-auto grid grid-cols-6 gap-1.5 pt-4">
          <Link
            to={`/product/${product?.slug}`}
            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-600 transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] dark:border-[#1A1A1A] dark:text-gray-400"
          >
            <Eye size={11} />
            View
          </Link>
          <button
            type="button"
            onClick={() => onQuickView?.(product)}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]"
            title="Quick view"
          >
            <Zap size={12} />
          </button>
          <button
            type="button"
            onClick={() => onCompare?.(product)}
            className={[
              'inline-flex items-center justify-center rounded-xl border transition-colors',
              inCompare
                ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]'
                : 'border-gray-200 text-gray-500 hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]',
            ].join(' ')}
            title="Compare"
          >
            <GitCompare size={12} />
          </button>
          <button
            type="button"
            onClick={() => onFindSimilar?.(product)}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]"
            title="Find similar"
          >
            <Search size={12} />
          </button>
          <button
            type="button"
            onClick={addToCart}
            disabled={(product?.stock || 0) <= 0}
            className="inline-flex items-center justify-center rounded-xl bg-[#D4AF37] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white dark:hover:text-black"
            title="Add to cart"
          >
            <ShoppingBag size={12} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default memo(LuxuryProductCard);
