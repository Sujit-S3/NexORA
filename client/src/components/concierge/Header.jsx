import { memo } from 'react';
import { Download, RotateCcw, Sparkles } from 'lucide-react';
import JourneyTimeline from './JourneyTimeline';
import { formatStageLabel } from './utils';

function Header({
  aiHealth,
  cartCount = 0,
  currentStage,
  onExportMemory,
  onStartOver,
  sessionGoal,
}) {
  const available = aiHealth?.available !== false;

  return (
    <header className="sticky top-16 z-30 border-b border-gray-200/80 bg-transparent px-4 py-3 backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#050505]/90 md:px-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-playfair text-xl text-black dark:text-white">Private Concierge</h1>
            <span
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest',
                available
                  ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'border-red-400/25 bg-red-500/10 text-red-400',
              ].join(' ')}
            >
              <span className={available ? 'h-1.5 w-1.5 rounded-full bg-[#D4AF37]' : 'h-1.5 w-1.5 rounded-full bg-red-400'} />
              {available ? 'Live AI' : 'Offline'}
            </span>
          </div>
          <p className="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-500">
            {sessionGoal || `${formatStageLabel(currentStage)} luxury shopping workspace`}
          </p>
        </div>

        <div className="min-w-0 flex-1 xl:max-w-3xl">
          <JourneyTimeline currentStage={currentStage} />
        </div>

        <div className="flex items-center justify-between gap-2 xl:justify-end">
          <div className="hidden items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-[9px] uppercase tracking-widest text-gray-500 dark:border-[#1A1A1A] dark:text-gray-500 sm:flex">
            <Sparkles size={11} className="text-[#D4AF37]" />
            {cartCount} cart
          </div>
          <button
            type="button"
            onClick={onExportMemory}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]"
            title="Save concierge session"
          >
            <Download size={15} />
          </button>
          <button
            type="button"
            onClick={onStartOver}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]"
            title="Start over"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}

export default memo(Header);
