import { memo } from 'react';
import { AlertTriangle } from 'lucide-react';

function ErrorState({ message = 'The AI concierge is temporarily unavailable.' }) {
  return (
    <section className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3">
      <div className="flex items-start gap-3">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-400" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-red-400">Concierge Offline</p>
          <p className="mt-1 text-[12px] leading-relaxed text-red-300">{message}</p>
        </div>
      </div>
    </section>
  );
}

export default memo(ErrorState);
