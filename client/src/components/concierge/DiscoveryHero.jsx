import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Send, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LUXURY_COLLECTIONS } from './constants';
import { getLuxuryFallback } from '../../utils/getLuxuryFallback';
import { formatPrice } from '../../utils/formatPrice';
import SuggestionBar from './SuggestionBar';

function DiscoveryProductRow({ products = [], title }) {
  const [start, setStart] = useState(0);
  if (!products.length) return null;

  const maxStart = Math.max(0, products.length - 4);

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-playfair text-lg text-black dark:text-white">{title}</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setStart(value => Math.max(0, value - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]"
            title="Previous"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => setStart(value => Math.min(maxStart, value + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]"
            title="Next"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {products.slice(start, start + 4).map(product => (
          <Link
            key={product._id || product.slug || product.name}
            to={`/product/${product.slug}`}
            className="group rounded-2xl border border-gray-200 bg-white/75 p-3 shadow-sm transition-colors hover:border-[#D4AF37]/50 dark:border-[#1A1A1A] dark:bg-[#080808]/80"
          >
            <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-[#F8F7F3] dark:bg-[#111]">
              <img
                loading="lazy"
                src={product.image || product.images?.[0]?.url || getLuxuryFallback(product.category?.name)}
                alt={product.name}
                className="h-full w-full object-contain p-3"
                onError={event => {
                  event.currentTarget.src = getLuxuryFallback(product.category?.name);
                }}
              />
            </div>
            <p className="truncate text-[8px] font-bold uppercase tracking-widest text-gray-500">{product.brand}</p>
            <h3 className="mt-1 truncate font-playfair text-[14px] text-black transition-colors group-hover:text-[#B38945] dark:text-white">
              {product.name}
            </h3>
            <p className="mt-1 text-[12px] text-gray-600 dark:text-gray-400">{formatPrice(product.discountPrice || product.price || 0)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DiscoveryHero({
  aiHealth,
  input,
  inputRef,
  onInputChange,
  onKeyDown,
  onSelectCollection,
  onSend,
  onStartWizard,
  placeholder,
  preChatRecs = {},
}) {
  const available = aiHealth?.available !== false;

  return (
    <div className="px-4 pb-16 pt-24 font-jakarta text-black dark:text-white md:px-6">
      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
              <Sparkles size={11} />
              {available ? 'NexORA Intelligence Active' : 'NexORA Intelligence Offline'}
            </div>
            <h1 className="font-playfair text-5xl leading-[1.02] text-black dark:text-white md:text-7xl">
              The private operating system for luxury shopping.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">
              Tell NexORA what you need and it will build the profile, curate the products, compare tradeoffs, and move you toward checkout.
            </p>
          </div>

          <div className="mt-8 rounded-3xl border border-gray-200 bg-white/80 p-3 shadow-[0_22px_80px_rgba(15,15,15,0.08)] backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/90">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={event => onInputChange(event.target.value)}
                onKeyDown={onKeyDown}
                disabled={!available}
                placeholder={available ? placeholder : 'Concierge is currently unavailable...'}
                className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-5 pr-14 text-[15px] text-black outline-none transition-colors focus:border-[#D4AF37]/50 disabled:opacity-50 dark:border-[#1A1A1A] dark:bg-[#0B0B0B] dark:text-white"
              />
              <button
                type="button"
                onClick={() => onSend()}
                disabled={!input.trim() || !available}
                className="absolute bottom-2 right-2 top-2 flex w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-35 dark:hover:bg-white dark:hover:text-black"
                title="Send"
              >
                <Send size={15} />
              </button>
            </div>
            <div className="mt-3">
              <SuggestionBar disabled={!available} onSelect={onSelectCollection} />
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5 backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/90">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">Launch A Journey</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {LUXURY_COLLECTIONS.map((collection, index) => {
              const Icon = collection.icon;
              return (
                <motion.button
                  key={collection.title}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => (collection.action === 'WIZARD' ? onStartWizard() : onSelectCollection(collection.prompt))}
                  className={[
                    'group min-h-[118px] rounded-2xl border bg-white/80 p-3 text-left shadow-sm transition-colors hover:border-[#D4AF37]/50 dark:bg-[#0B0B0B]',
                    collection.accent,
                  ].join(' ')}
                >
                  <Icon size={17} className="text-[#D4AF37]" />
                  <p className="mt-5 font-playfair text-[14px] leading-tight text-black transition-colors group-hover:text-[#B38945] dark:text-white">
                    {collection.title}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </aside>
      </section>

      <section className="mx-auto mt-12 grid max-w-7xl gap-8">
        <DiscoveryProductRow title="Executive Essentials" products={preChatRecs.executiveEssentials} />
        <DiscoveryProductRow title="Recommended Today" products={preChatRecs.recommendedToday} />
        <DiscoveryProductRow title="CEO Picks" products={preChatRecs.ceoPicks} />
        <DiscoveryProductRow title="New Arrivals" products={preChatRecs.newArrivals} />
      </section>
    </div>
  );
}

export default memo(DiscoveryHero);
