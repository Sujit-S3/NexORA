import { memo } from 'react';

function LoadingState({ label = 'Preparing concierge workspace' }) {
  return (
    <div className="flex min-h-[360px] items-center justify-center px-6 py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10" />
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">{label}</p>
      </div>
    </div>
  );
}

export default memo(LoadingState);
