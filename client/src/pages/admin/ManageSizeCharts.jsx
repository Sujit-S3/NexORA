import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Maximize } from 'lucide-react';
import Spinner from '@components/common/Spinner';

export default function ManageSizeCharts() {
  const [loading, setLoading] = useState(false);
  const [charts, setCharts] = useState([]);

  useEffect(() => {
    // We will implement API fetching here later
    setCharts([
      { _id: '1', name: 'Mens Shirts - Standard', category: 'Mens Tops', brand: 'Global', type: 'mens-tops' },
      { _id: '2', name: 'Womens Dresses', category: 'Womens Dresses', brand: 'Global', type: 'womens-dresses' },
    ]);
  }, []);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-8 pb-32 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <Maximize className="text-[#D4AF37]" size={32} />
            Size Charts
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage global sizing rules and category templates</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold tracking-widest uppercase bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all">
          <Plus size={16} /> New Size Chart
        </button>
      </div>

      <div className="bg-white dark:bg-[#0B0B0B] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-white/5">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search size charts..." 
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
            <thead className="bg-gray-50/50 dark:bg-black/20 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Category / Brand</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {charts.map(chart => (
                <tr key={chart._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 dark:text-white">{chart.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">{chart.category}</p>
                    <p className="text-xs text-gray-500">{chart.brand || 'Global'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                      {chart.type.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-[#D4AF37] bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {charts.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    No size charts found. Create a global template to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
