import { memo } from 'react';
import { motion } from 'framer-motion';
import { Award, CheckCircle, Minus, ShoppingBag, X } from 'lucide-react';
import { getLuxuryFallback } from '../../utils/getLuxuryFallback';
import { formatPrice } from '../../utils/formatPrice';
import { getProductImage } from './utils';

function CompareTable({ data, onAddCart, onClose }) {
  if (!data) return null;

  const { cons, products = [], pros, rows = [], verdict } = data;
  const winner = products.find(product => product.name === verdict?.winner);

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-white/90 shadow-[0_22px_70px_rgba(15,15,15,0.08)] backdrop-blur-xl dark:border-[#1A1A1A] dark:bg-[#080808]/90"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-[#1A1A1A]">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">Product Comparison</p>
          <h2 className="mt-1 font-playfair text-xl text-black dark:text-white">{products.length} pieces compared</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-[#D4AF37]/50 hover:text-[#D4AF37] dark:border-[#1A1A1A]"
          title="Close comparison"
        >
          <X size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr>
              <th className="w-40 px-5 py-4 text-left text-[9px] uppercase tracking-widest text-gray-500">Attribute</th>
              {products.map(product => (
                <th key={product._id || product.name} className="border-l border-gray-100 px-5 py-4 text-left dark:border-[#151515]">
                  <div className="mb-3 flex h-20 items-center justify-center rounded-xl bg-[#F8F7F3] dark:bg-[#111]">
                    <img
                      src={getProductImage(product, getLuxuryFallback)}
                      alt={product.name}
                      className="h-full w-full object-contain p-2"
                      onError={event => {
                        event.currentTarget.src = getLuxuryFallback(product?.category?.name);
                      }}
                    />
                  </div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500">{product.brand}</p>
                  <p className="mt-1 font-playfair text-[14px] font-normal text-black dark:text-white">{product.name}</p>
                  <p className="mt-1 text-[12px] text-[#B38945] dark:text-[#D4AF37]">{formatPrice(product.discountPrice || product.price || 0)}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={`${row.field}-${rowIndex}`} className={rowIndex % 2 === 0 ? 'bg-gray-50/70 dark:bg-[#101010]' : 'bg-white/60 dark:bg-[#080808]'}>
                <td className="px-5 py-3 text-[11px] font-semibold text-gray-500">{row.field}</td>
                {row.values?.map((value, valueIndex) => (
                  <td key={`${row.field}-${valueIndex}`} className="border-l border-gray-100 px-5 py-3 text-[12px] leading-relaxed text-gray-700 dark:border-[#151515] dark:text-gray-300">
                    {value}
                  </td>
                ))}
              </tr>
            ))}
            {(pros || cons) && (
              <tr className="border-t border-gray-200 dark:border-[#1A1A1A]">
                <td className="px-5 py-4 align-top text-[11px] font-semibold text-gray-500">Pros / Cons</td>
                {products.map(product => (
                  <td key={product._id || product.name} className="border-l border-gray-100 px-5 py-4 align-top dark:border-[#151515]">
                    {pros?.[product._id]?.map(item => (
                      <p key={item} className="mb-2 flex items-start gap-1.5 text-[11px] text-emerald-500">
                        <CheckCircle size={12} className="mt-0.5 shrink-0" />
                        {item}
                      </p>
                    ))}
                    {cons?.[product._id]?.map(item => (
                      <p key={item} className="mb-2 flex items-start gap-1.5 text-[11px] text-red-400">
                        <Minus size={12} className="mt-0.5 shrink-0" />
                        {item}
                      </p>
                    ))}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {verdict && (
        <div className="flex flex-col gap-3 border-t border-[#D4AF37]/20 bg-[#D4AF37]/10 px-5 py-4 md:flex-row md:items-center">
          <Award size={18} className="text-[#D4AF37]" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#D4AF37]">Concierge Verdict</p>
            <p className="mt-1 text-[13px] leading-relaxed text-black dark:text-white">
              <strong>{verdict.winner}</strong>: {verdict.reason}
            </p>
          </div>
          {winner && (
            <button
              type="button"
              onClick={() => onAddCart?.(winner, 1, winner?.variants?.length > 0 ? winner.variants[0].size : '')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
            >
              <ShoppingBag size={13} />
              Add Winner
            </button>
          )}
        </div>
      )}
    </motion.section>
  );
}

export default memo(CompareTable);
