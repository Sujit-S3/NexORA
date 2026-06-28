import { memo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  GitCompare,
  Send,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CompareTable from './CompareTable';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import RecommendationSession from './RecommendationSession';
import StreamingStatus from './StreamingStatus';
import SuggestionBar from './SuggestionBar';
import TypingIndicator from './TypingIndicator';
import { formatStageLabel } from './utils';

function QuickViewPanel({ onClose, product }) {
  if (!product) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 backdrop-blur-sm md:items-center md:justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          onClick={event => event.stopPropagation()}
          className="w-full max-w-xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-[#1A1A1A] dark:bg-[#090909]"
        >
          <div className="flex items-start justify-between border-b border-gray-200 px-5 py-4 dark:border-[#1A1A1A]">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">{product.brand}</p>
              <h2 className="mt-1 font-playfair text-2xl text-black dark:text-white">{product.name}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]"
              title="Close quick view"
            >
              <X size={14} />
            </button>
          </div>
          <div className="space-y-4 p-5">
            <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
              {product.aiExplanation || product.recommendationReason || product.description || 'This piece was selected for the current concierge brief.'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-600 dark:text-gray-400">
              <div className="rounded-2xl border border-gray-200 p-3 dark:border-[#1A1A1A]">
                <p className="text-[8px] font-bold uppercase tracking-widest text-[#D4AF37]">Warranty</p>
                <p className="mt-1">{product.warranty || 'Authenticity verified'}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-3 dark:border-[#1A1A1A]">
                <p className="text-[8px] font-bold uppercase tracking-widest text-[#D4AF37]">Delivery</p>
                <p className="mt-1">{product.delivery || product.deliveryEstimate || 'Priority delivery'}</p>
              </div>
            </div>
            <Link
              to={`/product/${product.slug}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
            >
              View Product
              <ArrowRight size={13} />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ShoppingGoal({ currentStage, productsFound = 0, sessionGoal }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/80">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
            <Target size={17} className="text-[#D4AF37]" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">Shopping Goal</p>
            <h2 className="mt-1 truncate font-playfair text-2xl text-black dark:text-white">
              {sessionGoal || 'Curate the next best luxury purchase'}
            </h2>
            <p className="mt-1 text-[11px] text-gray-500">Backend journey stage: {formatStageLabel(currentStage)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-2xl border border-gray-200 px-4 py-2 dark:border-[#1A1A1A]">
            <p className="text-[8px] uppercase tracking-widest text-gray-500">Products</p>
            <p className="mt-1 text-lg text-black dark:text-white">{productsFound}</p>
          </div>
          <div className="rounded-2xl border border-gray-200 px-4 py-2 dark:border-[#1A1A1A]">
            <p className="text-[8px] uppercase tracking-widest text-gray-500">Stage</p>
            <p className="mt-1 text-[12px] text-black dark:text-white">{formatStageLabel(currentStage)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecommendationWorkspace({
  aiHealth,
  compareData,
  compareLoading,
  compareProducts = [],
  currentStage,
  input,
  inputRef,
  isInWishlist,
  loading = false,
  onAction,
  onAddCart,
  onCompare,
  onFindSimilar,
  onInputChange,
  onKeyDown,
  onRetry,
  onRunCompare,
  onSend,
  onToggleCompare,
  onToggleWishlist,
  onCloseCompare,
  scrollRef,
  sessionData = {},
  sessionGoal,
  sessions = [],
  statusMessage,
  statusStep,
}) {
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const available = aiHealth?.available !== false;

  return (
    <main className="flex min-w-0 flex-col gap-4">
      {!available && <ErrorState message="The AI service is offline. Existing session data remains available." />}

      <ShoppingGoal
        currentStage={currentStage}
        productsFound={sessionData?.productsFound || sessions[sessions.length - 1]?.productsFound || 0}
        sessionGoal={sessionGoal}
      />

      <AnimatePresence>{loading && statusMessage && <StreamingStatus message={statusMessage} step={statusStep} />}</AnimatePresence>

      <div ref={scrollRef} className="space-y-5">
        {sessions.length === 0 && !loading && (
          <EmptyState disabled={!available} onSelectSuggestion={onAction} />
        )}

        {sessions.map((session, index) => (
          <RecommendationSession
            key={session.id}
            session={session}
            index={index}
            loading={loading}
            isLatest={index === sessions.length - 1}
            compareProducts={compareProducts}
            onAddCart={onAddCart}
            onToggleWishlist={onToggleWishlist}
            isInWishlist={isInWishlist}
            onCompare={onToggleCompare}
            onFindSimilar={onFindSimilar}
            onQuickView={setQuickViewProduct}
            onAction={onAction}
            onRetry={onRetry}
          />
        ))}

        {compareData && (
          <CompareTable data={compareData} onAddCart={onAddCart} onClose={onCloseCompare} />
        )}

        {loading && !statusMessage && <TypingIndicator />}
      </div>

      <AnimatePresence>
        {compareProducts.length >= 2 && !compareData && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            className="sticky bottom-24 z-20 flex flex-col gap-3 rounded-2xl border border-[#D4AF37]/30 bg-white/90 px-4 py-3 shadow-[0_18px_60px_rgba(15,15,15,0.12)] backdrop-blur-xl dark:bg-[#080808]/90 md:flex-row md:items-center"
          >
            <div className="flex items-center gap-2">
              <GitCompare size={15} className="text-[#D4AF37]" />
              <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{compareProducts.length} selected for comparison</p>
            </div>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {compareProducts.map(product => (
                <span key={product._id || product.name} className="inline-flex items-center gap-1 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-2 py-1 text-[9px] text-[#B38945] dark:text-[#D4AF37]">
                  {product.name?.slice(0, 18)}
                  <button type="button" onClick={() => onCompare?.(product)} title="Remove from comparison">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={onRunCompare}
              disabled={compareLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white disabled:opacity-50 dark:hover:bg-white dark:hover:text-black"
            >
              <Sparkles size={12} />
              {compareLoading ? 'Comparing' : 'Compare Now'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="sticky bottom-0 z-30 rounded-3xl border border-gray-200 bg-white/90 p-3 shadow-[0_-18px_70px_rgba(15,15,15,0.08)] backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#050505]/90">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={event => onInputChange(event.target.value)}
            onKeyDown={onKeyDown}
            disabled={!available || loading}
            rows={1}
            placeholder={available ? 'Describe the next move in your shopping journey...' : 'Concierge is currently unavailable...'}
            className="min-h-[54px] w-full resize-none rounded-2xl border border-gray-200 bg-white py-4 pl-4 pr-14 text-[14px] text-black outline-none transition-colors focus:border-[#D4AF37]/50 disabled:opacity-50 dark:border-[#1A1A1A] dark:bg-[#0B0B0B] dark:text-white"
          />
          <button
            type="button"
            onClick={() => onSend()}
            disabled={!input.trim() || !available || loading}
            className="absolute bottom-2.5 right-2.5 top-2.5 flex w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white dark:hover:text-black"
            title="Send"
          >
            <Send size={15} />
          </button>
        </div>
        <div className="mt-3">
          <SuggestionBar disabled={!available || loading} onSelect={onAction} />
        </div>
      </section>

      <QuickViewPanel product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </main>
  );
}

export default memo(RecommendationWorkspace);
