import { memo } from 'react';
import {
  CreditCard,
  GitCompare,
  RotateCcw,
  Save,
  Search,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

function ActionCenter({
  cartCount = 0,
  compareCount = 0,
  compareLoading = false,
  onCheckout,
  onCompare,
  onContinueShopping,
  onExploreCollection,
  onFindSimilar,
  onSaveSession,
}) {
  const actions = [
    {
      label: compareLoading ? 'Comparing' : 'Compare',
      icon: GitCompare,
      onClick: onCompare,
      disabled: compareCount < 2 || compareLoading,
      meta: `${compareCount}/3`,
    },
    {
      label: 'Find Similar',
      icon: Search,
      onClick: onFindSimilar,
    },
    {
      label: 'Explore Collection',
      icon: Sparkles,
      onClick: onExploreCollection,
    },
    {
      label: 'Checkout',
      icon: CreditCard,
      onClick: onCheckout,
      disabled: cartCount < 1,
      meta: `${cartCount}`,
    },
    {
      label: 'Continue Shopping',
      icon: ShoppingBag,
      onClick: onContinueShopping,
    },
    {
      label: 'Save Session',
      icon: Save,
      onClick: onSaveSession,
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white/75 backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/80">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-[#1A1A1A]">
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">Action Center</p>
        <RotateCcw size={12} className="text-gray-500" />
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {actions.map(action => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex min-h-[64px] flex-col justify-between rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#1A1A1A] dark:bg-[#111]"
            >
              <div className="flex items-center justify-between">
                <Icon size={14} className="text-[#D4AF37]" />
                {action.meta && <span className="text-[9px] text-gray-500">{action.meta}</span>}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-700 dark:text-gray-300">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default memo(ActionCenter);
