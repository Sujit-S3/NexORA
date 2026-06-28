import { memo } from 'react';
import { JOURNEY_STAGES } from './constants';
import { formatStageLabel } from './utils';

function JourneyTimeline({ currentStage }) {
  const activeIndex = JOURNEY_STAGES.findIndex(stage => stage.id === currentStage);

  return (
    <nav aria-label="Shopping journey" className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex min-w-max items-center gap-0 px-1">
        {JOURNEY_STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = stage.id === currentStage;
          const isPast = activeIndex >= 0 && index < activeIndex;

          return (
            <div key={stage.id} className="flex items-center">
              <div
                className={[
                  'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-widest transition-colors',
                  isActive
                    ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]'
                    : isPast
                      ? 'border-[#D4AF37]/20 text-[#D4AF37]/60'
                      : 'border-transparent text-gray-500 dark:text-gray-600',
                ].join(' ')}
                title={formatStageLabel(stage.id)}
              >
                <Icon size={10} />
                <span>{stage.label}</span>
              </div>
              {index < JOURNEY_STAGES.length - 1 && (
                <div
                  className={[
                    'h-px w-5 transition-colors',
                    isPast || isActive ? 'bg-[#D4AF37]/30' : 'bg-gray-200 dark:bg-[#222]',
                  ].join(' ')}
                />
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export default memo(JourneyTimeline);
