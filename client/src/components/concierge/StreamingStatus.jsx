import { memo } from 'react';
import { motion } from 'framer-motion';
import { STREAMING_STAGES } from './constants';

function StreamingStatus({ message, step = 1 }) {
  if (!message) return null;
  const activeIndex = Math.max(0, Math.min(STREAMING_STAGES.length - 1, Number(step || 1) - 1));

  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-2xl border border-[#D4AF37]/25 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/80"
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
          {message || STREAMING_STAGES[activeIndex]}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
        {STREAMING_STAGES.map((stage, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;

          return (
            <div key={stage} className="min-w-0">
              <div className="h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-[#1A1A1A]">
                <motion.div
                  className="h-full rounded-full bg-[#D4AF37]"
                  initial={false}
                  animate={{ width: isDone ? '100%' : isActive ? '62%' : '0%' }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                />
              </div>
              <p className={['mt-1 truncate text-[7px] uppercase tracking-widest', isActive || isDone ? 'text-[#D4AF37]' : 'text-gray-500'].join(' ')}>
                {stage.replace('...', '')}
              </p>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

export default memo(StreamingStatus);
