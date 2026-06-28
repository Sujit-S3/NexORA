import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { QUICK_SUGGESTIONS } from './constants';

function SuggestionBar({ disabled = false, onSelect, suggestions = QUICK_SUGGESTIONS }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {suggestions.map(suggestion => (
        <button
          key={suggestion}
          type="button"
          onClick={() => onSelect?.(suggestion)}
          disabled={disabled}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-[10px] font-semibold text-gray-600 transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#1A1A1A] dark:bg-[#0B0B0B] dark:text-gray-400"
        >
          <Sparkles size={10} className="text-[#D4AF37]" />
          {suggestion}
        </button>
      ))}
    </div>
  );
}

export default memo(SuggestionBar);
