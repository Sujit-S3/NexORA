import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SizeSelector({ 
  variants = [], 
  selectedSize, 
  setSelectedSize, 
  sizeError, 
  setSizeError, 
  setShowSizeGuide,
  fitType,
  fitRecommendation // From AI
}) {
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // Group by size (ignoring color for the size selector itself if color is handled separately)
  const uniqueSizes = Array.from(new Set(variants.map(v => v.size)));

  const handleSelect = (size) => {
    setSelectedSize(size);
    setSizeError(false);
    setIsMobileSheetOpen(false);
  };

  const recommendedSize = fitRecommendation?.recommendedSize;
  const confidence = fitRecommendation?.confidence;
  const fitWarnings = fitRecommendation?.fitWarnings || [];
  const reasoning = fitRecommendation?.reasoning || [];

  const DesktopSelector = () => (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-bold tracking-widest uppercase text-gray-500">Select Size</span>
        <button onClick={() => setShowSizeGuide(true)} className="text-[11px] uppercase tracking-widest hover:underline text-[#D4AF37] flex items-center gap-1">
          <Ruler size={12} /> Size Guide
        </button>
      </div>

      {recommendedSize && (
        <div className="mb-4 p-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#D4AF37]" />
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[12px] font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-2">
              <CheckCircle2 size={14} /> Recommended Size: {recommendedSize}
            </h4>
            <span className="text-[11px] font-bold text-[#D4AF37]">{confidence}% Match</span>
          </div>
          <ul className="text-[11px] text-gray-500 space-y-1 ml-5 list-disc">
            {reasoning.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      {fitWarnings.length > 0 && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-500 text-[11px] flex items-start gap-2">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1">
            {fitWarnings.map((w, i) => <span key={i}>{w}</span>)}
          </div>
        </div>
      )}

      <div className={`grid grid-cols-4 gap-2 transition-colors duration-300 ${sizeError ? 'p-2 -m-2 rounded-xl bg-red-500/10 border border-red-500/30' : ''}`}>
        {uniqueSizes.map(size => {
          // Find stock across colors for this size (simplified for now)
          const stock = variants.filter(v => v.size === size).reduce((a, b) => a + b.stock, 0);
          const isSelected = selectedSize === size;
          const isRecommended = size === recommendedSize;

          return (
            <button 
              key={size}
              disabled={stock === 0}
              onClick={() => handleSelect(size)}
              className={`relative h-14 flex flex-col items-center justify-center rounded-lg transition-all
                ${stock === 0 ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-[#111]' : 
                  isSelected ? 'border-2 scale-[1.02] shadow-lg z-10' : 'border hover:border-gray-400 dark:hover:border-gray-600 bg-white dark:bg-[#0B0B0B]'}`}
              style={{ 
                borderColor: isSelected ? '#D4AF37' : (isRecommended ? '#D4AF37' : 'inherit'),
                background: isSelected ? '#D4AF37' : 'inherit',
                color: isSelected ? '#000' : 'inherit'
              }}
            >
              <span className="text-[13px] font-bold">{size}</span>
              {isRecommended && !isSelected && <span className="absolute -top-2 bg-[#D4AF37] text-black text-[9px] font-bold px-1.5 rounded-sm">✓</span>}
              {stock > 0 && stock <= 3 && !isSelected && <span className="absolute bottom-1 text-[9px] text-red-500 font-bold">{stock} left</span>}
            </button>
          );
        })}
      </div>
      {sizeError && <p className="text-red-500 text-xs mt-3 font-medium">Please select a size.</p>}
    </div>
  );

  return (
    <>
      {/* Desktop (Hidden on mobile) */}
      <div className="hidden md:block w-full">
        <DesktopSelector />
      </div>

      {/* Mobile (Hidden on desktop) */}
      <div className="block md:hidden w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] font-bold tracking-widest uppercase text-gray-500">Size</span>
          <button onClick={() => setShowSizeGuide(true)} className="text-[11px] uppercase tracking-widest text-[#D4AF37]">Size Guide</button>
        </div>
        <button 
          onClick={() => setIsMobileSheetOpen(true)}
          className={`w-full h-14 px-4 rounded-xl flex items-center justify-between border ${sizeError ? 'border-red-500' : 'border-gray-200 dark:border-[#1A1A1A]'} bg-white dark:bg-[#0B0B0B]`}
        >
          <span className={selectedSize ? "font-bold text-[14px]" : "text-gray-400 text-[14px]"}>
            {selectedSize ? `Size: ${selectedSize}` : 'Select Size'}
          </span>
          <span className="text-[#D4AF37]">{recommendedSize && !selectedSize ? `Recommended: ${recommendedSize}` : 'Change'}</span>
        </button>
        {sizeError && <p className="text-red-500 text-xs mt-2 font-medium">Please select a size.</p>}
      </div>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {isMobileSheetOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileSheetOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0B0B0B] rounded-t-3xl z-[101] p-6 pb-10 shadow-2xl md:hidden border-t border-gray-200 dark:border-[#1A1A1A]"
            >
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-800 rounded-full mx-auto mb-6" />
              <DesktopSelector />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
