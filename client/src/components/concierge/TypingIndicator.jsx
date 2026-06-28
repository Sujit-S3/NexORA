import { memo } from 'react';

function TypingIndicator() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-2">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37]" style={{ animationDelay: '120ms' }} />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#D4AF37]" style={{ animationDelay: '240ms' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">Curating</span>
    </div>
  );
}

export default memo(TypingIndicator);
