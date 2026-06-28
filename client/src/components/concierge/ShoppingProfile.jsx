import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { PROFILE_FIELDS } from './constants';
import { formatProfileValue, formatStageLabel, getProfileConfidence } from './utils';

function ShoppingProfile({
  journeyStage,
  loading = false,
  memory = {},
  onRemoveKey,
  sessionData = {},
}) {
  const confidence = useMemo(() => getProfileConfidence(memory, sessionData), [memory, sessionData]);
  const activeFields = useMemo(() => {
    const memoryFields = PROFILE_FIELDS
      .map(field => ({ ...field, value: memory[field.key] }))
      .filter(field => {
        if (Array.isArray(field.value)) return field.value.length > 0;
        return Boolean(field.value);
      });

    return [
      ...memoryFields,
      {
        key: 'journeyStage',
        label: 'Journey Stage',
        icon: PROFILE_FIELDS[2].icon,
        value: journeyStage,
        locked: true,
      },
    ].filter(field => field.value);
  }, [journeyStage, memory]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-white/80 shadow-[0_18px_50px_rgba(15,15,15,0.08)] backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/80">
      <div className="border-b border-[#D4AF37]/10 px-4 py-3 dark:border-[#1A1A1A]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">Shopping Profile</p>
            <p className="mt-1 text-[11px] text-gray-500">
              {activeFields.length > 1 ? `${activeFields.length - 1} preferences captured` : 'Learning from each response'}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
            <span className="text-xs font-bold text-[#D4AF37]">{confidence}</span>
          </div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-gray-200 dark:bg-[#171717]">
          <motion.div
            animate={{ width: `${confidence}%` }}
            className="h-full rounded-full bg-[#D4AF37]"
            transition={{ duration: 0.45, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="space-y-2 p-3">
        {activeFields.length === 0 && !loading ? (
          <p className="px-2 py-3 text-[12px] leading-relaxed text-gray-500">
            Share a budget, brand, occasion, or style and NexORA will keep this profile current.
          </p>
        ) : (
          activeFields.map(field => {
            const Icon = field.icon;
            const value = field.key === 'journeyStage'
              ? formatStageLabel(field.value)
              : formatProfileValue(field.key, field.value);

            return (
              <motion.div
                key={field.key}
                layout
                className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200/80 bg-white/60 px-3 py-2.5 dark:border-[#1A1A1A] dark:bg-[#111]/70"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Icon size={12} className="shrink-0 text-[#D4AF37]" />
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">{field.label}</p>
                    <p className="truncate text-[12px] font-medium text-black dark:text-white">{value}</p>
                  </div>
                </div>
                {!field.locked && onRemoveKey && (
                  <button
                    type="button"
                    onClick={() => onRemoveKey(field.key)}
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    title={`Remove ${field.label}`}
                  >
                    <X size={12} className="text-gray-400 hover:text-red-400" />
                  </button>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default memo(ShoppingProfile);
