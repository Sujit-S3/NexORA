import { memo } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, RotateCcw, Sparkles } from 'lucide-react';
import LuxuryProductCard from './LuxuryProductCard';
import { shouldShowRetry } from './utils';

function RecommendationSession({
  compareProducts = [],
  index = 0,
  isInWishlist,
  isLatest = false,
  loading = false,
  onAction,
  onAddCart,
  onCompare,
  onFindSimilar,
  onQuickView,
  onRetry,
  onToggleWishlist,
  session,
}) {
  const retryVisible = shouldShowRetry(session, isLatest, loading);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.32 }}
      className="overflow-hidden rounded-3xl border border-gray-200 bg-white/80 shadow-[0_22px_70px_rgba(15,15,15,0.08)] backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/90"
    >
      <header className="border-b border-gray-200 px-5 py-4 dark:border-[#1A1A1A]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">Recommendation Session</p>
            <h2 className="font-playfair text-2xl leading-tight text-black dark:text-white">{session.goal}</h2>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-gray-200 px-3 py-2 dark:border-[#1A1A1A]">
              <p className="text-[8px] uppercase tracking-widest text-gray-500">Intent</p>
              <p className="mt-1 max-w-[120px] truncate text-[11px] text-black dark:text-white">{session.detectedIntent}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-3 py-2 dark:border-[#1A1A1A]">
              <p className="text-[8px] uppercase tracking-widest text-gray-500">Filters</p>
              <p className="mt-1 text-[11px] text-black dark:text-white">{session.filters?.length || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-3 py-2 dark:border-[#1A1A1A]">
              <p className="text-[8px] uppercase tracking-widest text-gray-500">Found</p>
              <p className="mt-1 text-[11px] text-black dark:text-white">{session.productsFound}</p>
            </div>
          </div>
        </div>

        {session.filters?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {session.filters.slice(0, 8).map(filter => (
              <span key={`${filter.key}-${filter.value}`} className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2.5 py-1 text-[9px] text-[#B38945] dark:text-[#D4AF37]">
                {filter.label}: {filter.value}
              </span>
            ))}
          </div>
        )}
      </header>

      {session.products?.length > 0 && (
        <div className="border-b border-gray-100 px-5 py-5 dark:border-[#151515]">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#D4AF37]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-500">Curated Products</p>
            </div>
            <p className="text-[10px] text-gray-500">Products first, rationale next</p>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {session.products.map((product, productIndex) => (
              <LuxuryProductCard
                key={product._id || product.slug || product.name}
                product={product}
                index={productIndex}
                onAddCart={onAddCart}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={isInWishlist?.(product._id)}
                onCompare={onCompare}
                inCompare={compareProducts.some(item => item._id === product._id)}
                onFindSimilar={onFindSimilar}
                onQuickView={onQuickView}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 px-5 py-5">
        {session.explanation && (
          <div className="rounded-2xl border border-gray-200 bg-white/68 p-4 dark:border-[#1A1A1A] dark:bg-[#111]/66">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">AI Explanation</p>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-700 dark:text-gray-300">{session.explanation}</p>
          </div>
        )}

        {session.actionConfirmed && (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-500">
            <CheckCircle size={12} />
            {session.actionProduct ? `Updated ${session.actionProduct}` : 'Action completed'}
          </div>
        )}

        {retryVisible && (
          <button
            type="button"
            onClick={() => onRetry?.(session.userPrompt)}
            className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] transition-colors hover:bg-[#D4AF37] hover:text-black"
          >
            <RotateCcw size={12} />
            Retry request
          </button>
        )}

        {session.suggestedActions?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {session.suggestedActions.map(action => (
              <button
                key={action}
                type="button"
                onClick={() => onAction?.(action)}
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-semibold text-gray-600 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A] dark:text-gray-400"
              >
                <AlertCircle size={11} />
                {action}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}

export default memo(RecommendationSession);
