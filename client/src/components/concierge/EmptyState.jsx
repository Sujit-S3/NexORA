import { memo } from 'react';
import { Gem, Sparkles } from 'lucide-react';
import SuggestionBar from './SuggestionBar';

function EmptyState({ disabled = false, onSelectSuggestion }) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-white/75 p-8 text-center shadow-sm backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/80">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10">
        <Gem size={20} className="text-[#D4AF37]" />
      </div>
      <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">Concierge Workspace</p>
      <h2 className="mt-2 font-playfair text-3xl text-black dark:text-white">Start with a goal.</h2>
      <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-gray-500">
        NexORA will turn your request into a shopping profile, ranked products, and next best actions.
      </p>
      <div className="mx-auto mt-6 max-w-3xl">
        <SuggestionBar disabled={disabled} onSelect={onSelectSuggestion} />
      </div>
      <Sparkles size={16} className="mx-auto mt-6 text-[#D4AF37]" />
    </section>
  );
}

export default memo(EmptyState);
