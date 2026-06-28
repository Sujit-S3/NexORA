import { memo } from 'react';
import {
  Clock,
  CreditCard,
  GitCompare,
  Heart,
  Package,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

const ICONS = {
  cart: ShoppingBag,
  checkout: CreditCard,
  compare: GitCompare,
  message: Sparkles,
  products: Package,
  wishlist: Heart,
};

function ConversationTimeline({ events = [] }) {
  const visibleEvents = events.slice(-8).reverse();

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/70 backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/80">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-[#1A1A1A]">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">Conversation Timeline</p>
      </div>
      <div className="max-h-64 space-y-1 overflow-y-auto p-3 scrollbar-hide">
        {visibleEvents.length === 0 ? (
          <p className="px-2 py-4 text-[12px] leading-relaxed text-gray-500">
            Actions, comparisons, carts, and checkout steps will appear here as backend events arrive.
          </p>
        ) : (
          visibleEvents.map((event, index) => {
            const Icon = ICONS[event.type] || Clock;
            return (
              <div key={`${event.ts || index}-${event.label}`} className="flex items-start gap-2.5 rounded-xl px-2 py-2">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10">
                  <Icon size={11} className="text-[#D4AF37]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] leading-snug text-black dark:text-gray-200">{event.label}</p>
                  {event.ts && (
                    <p className="mt-1 text-[8px] uppercase tracking-widest text-gray-500">
                      {new Date(event.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default memo(ConversationTimeline);
