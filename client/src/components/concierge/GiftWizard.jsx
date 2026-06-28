import { memo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Gift, X } from 'lucide-react';
import { WIZARD_STEPS } from './constants';

function GiftWizard({
  onClose,
  onSelect,
  stepIndex = 0,
  wizardData = {},
}) {
  const step = WIZARD_STEPS[stepIndex];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pb-16 pt-24 font-jakarta text-black dark:text-white">
      <section className="w-full max-w-2xl">
        <div className="mb-8 flex items-start justify-between gap-6">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
              <Gift size={12} />
              Gift Concierge
            </div>
            <h1 className="font-playfair text-4xl leading-tight md:text-5xl">{step.title}</h1>
            <p className="mt-3 text-[13px] text-gray-500">
              Step {stepIndex + 1} of {WIZARD_STEPS.length}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]"
          >
            <X size={12} />
            Close
          </button>
        </div>

        <div className="mb-8 grid grid-cols-4 gap-2">
          {WIZARD_STEPS.map((item, index) => (
            <div key={item.id}>
              <div className={index <= stepIndex ? 'h-1 rounded-full bg-[#D4AF37]' : 'h-1 rounded-full bg-gray-200 dark:bg-[#1A1A1A]'} />
              <p className={index === stepIndex ? 'mt-2 text-[8px] font-bold uppercase tracking-widest text-[#D4AF37]' : 'mt-2 text-[8px] font-bold uppercase tracking-widest text-gray-500'}>
                {item.id}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {step.options.map((option, index) => (
            <motion.button
              key={option}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => onSelect(option)}
              className={[
                'group rounded-2xl border bg-white/80 p-5 text-left shadow-sm transition-colors hover:border-[#D4AF37]/50 dark:bg-[#080808]/80',
                wizardData[step.id] === option ? 'border-[#D4AF37]/60' : 'border-gray-200 dark:border-[#1A1A1A]',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[15px] font-medium text-black dark:text-white">{option}</span>
                <ArrowRight size={16} className="text-[#D4AF37] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default memo(GiftWizard);
