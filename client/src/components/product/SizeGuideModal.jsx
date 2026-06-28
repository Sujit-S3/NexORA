import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ruler, RefreshCcw } from 'lucide-react';

export default function SizeGuideModal({ isOpen, onClose, sizeChart }) {
  if (!isOpen) return null;

  // Fallback if no sizeChart object provided (e.g. legacy HTML)
  if (!sizeChart || typeof sizeChart !== 'object') {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl rounded-2xl overflow-hidden p-8 max-h-[90vh] overflow-y-auto shadow-2xl bg-white dark:bg-[#0B0B0B] border border-gray-200 dark:border-[#1A1A1A]">
          <button onClick={onClose} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors z-10">
            <X size={16} />
          </button>
          <h2 className="font-playfair text-3xl mb-8 text-center text-black dark:text-white">Size Guide</h2>
          <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: sizeChart || 'Size chart unavailable.' }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, y: 50, scale: 0.95 }} 
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-3xl rounded-[24px] overflow-hidden shadow-2xl bg-white/80 dark:bg-[#0B0B0B]/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 flex flex-col max-h-full"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-200/30 dark:border-[#1A1A1A] flex items-center justify-between sticky top-0 bg-white/50 dark:bg-[#0B0B0B]/50 backdrop-blur-xl z-20">
          <div>
            <h2 className="font-playfair text-2xl text-black dark:text-white">Size Guide</h2>
            {sizeChart.brand && <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">{sizeChart.brand} • {sizeChart.name}</p>}
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 transition-colors text-black dark:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          
          {/* Measurement Table */}
          {sizeChart.columns && sizeChart.rows && (
            <div className="mb-12">
              <h3 className="text-[13px] font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <Ruler size={16} /> Measurements
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-800">
                      {sizeChart.columns.map((col, i) => (
                        <th key={i} className="py-4 px-4 font-playfair text-sm text-gray-500">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChart.rows.map((row, i) => (
                      <tr key={i} className="border-b border-gray-200/50 dark:border-gray-800/50 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 font-bold text-black dark:text-white">{row.label}</td>
                        {sizeChart.columns.slice(1).map((col, j) => (
                          <td key={j} className="py-4 px-4 text-[13px] text-gray-600 dark:text-gray-400">
                            {row.measurements[col] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* How To Measure & Fit Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
              <h4 className="font-playfair text-lg text-black dark:text-white mb-3">How to Measure</h4>
              <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">{sizeChart.howToMeasure}</p>
            </div>
            <div className="p-6 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <h4 className="font-playfair text-lg text-[#D4AF37] mb-3">Fit Recommendation</h4>
              <p className="text-[13px] leading-relaxed text-[#D4AF37] dark:text-[#C9A96E] opacity-90">{sizeChart.fitRecommendation}</p>
            </div>
          </div>

          {/* Model & Returns */}
          <div className="flex flex-col md:flex-row items-center gap-8 pt-8 border-t border-gray-200/50 dark:border-gray-800/50">
            {sizeChart.modelInfo && (
              <div className="flex-1">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Model Information</span>
                <p className="text-[12px] text-black dark:text-gray-300">{sizeChart.modelInfo}</p>
              </div>
            )}
            {sizeChart.returnPolicy && (
              <div className="flex-1 flex items-start gap-3">
                <RefreshCcw size={16} className="text-gray-400 shrink-0 mt-1" />
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">Returns</span>
                  <p className="text-[12px] text-black dark:text-gray-300">{sizeChart.returnPolicy}</p>
                </div>
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
