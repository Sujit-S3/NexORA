import { useState, useEffect } from 'react';
import axios from 'axios';
import { adminService } from '@services/adminService';
import Spinner from '@components/common/Spinner';

const Analytics = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [stats, setStats] = useState(null);
  const [prefStats, setPrefStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [dashRes, prefRes] = await Promise.all([
        adminService.getDashboardStats(),
        axios.get(`${import.meta.env.VITE_API_URL}/preferences/analytics`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      ]);
      setStats(dashRes.data.data);
      setPrefStats(prefRes.data.data);
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async () => {
    if (!window.confirm('WARNING: This will delete all existing products and categories, and replace them with the premium demo catalog. Are you sure?')) {
      return;
    }

    setIsInitializing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/seed`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(res.data.message || 'Database Initialized Successfully');
      fetchStats(); // Refresh stats
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initialize database');
    } finally {
      setIsInitializing(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex justify-center items-center bg-transparent"><Spinner size="lg" /></div>;
  }

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] mb-0 tracking-tight">System Initialization & Analytics</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Initialization Card */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-8 relative overflow-hidden group border border-[#D4AF37]/30 shadow-[0_8px_32px_rgba(212,175,55,0.1)]">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-[#D4AF37] transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <h2 className="text-xl font-bold text-[#111827] dark:text-[#F5F5F5] mb-4 relative z-10">Database Seeder</h2>
              <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mb-8 relative z-10">
                Initialize the database with the premium luxury catalog (Rolex, Tesla, Apple, Dior). This will clear existing products and categories.
              </p>
              <button
                onClick={handleInitialize}
                disabled={isInitializing}
                className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-gradient-to-r from-[#D4AF37] to-[#B38945] hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] transition-all relative z-10 disabled:opacity-50"
              >
                {isInitializing ? <Spinner size="sm" className="mr-2" /> : null}
                {isInitializing ? 'Initializing...' : 'Initialize Demo Data'}
              </button>
            </div>
          </div>

          {/* Analytics Overview */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-panel p-8">
              <h2 className="text-xl font-bold text-[#111827] dark:text-[#F5F5F5] mb-6">Top Selling Products</h2>
              {stats?.topProducts && stats.topProducts.length > 0 ? (
                <div className="space-y-4">
                  {stats.topProducts.map((product, index) => (
                    <div key={product._id} className="flex items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)]">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center font-bold text-sm">
                          #{index + 1}
                        </div>
                        <img src={product.images?.[0]?.url || '/logo-nexora-dark.jpg'} className="w-12 h-12 rounded-lg object-cover" alt={product.name} />
                        <div>
                          <h3 className="text-[#111827] dark:text-[#F5F5F5] font-semibold">{product.name}</h3>
                          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">₹{product.price?.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#D4AF37]">{product.sold}</p>
                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wider">Sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#6B7280] dark:text-[#9CA3AF]">
                  No sales data available yet.
                </div>
              )}
            </div>
            
            {/* New Intelligence Metrics Block */}
            {prefStats && (
              <div className="glass-panel p-8 mt-8">
                <h2 className="text-xl font-bold text-[#111827] dark:text-[#F5F5F5] mb-6 flex items-center gap-2">
                  <span className="text-[#D4AF37]">✦</span> NexORA Intelligence Metrics
                </h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                   <div className="p-4 bg-white/50 dark:bg-[#0B1220]/60 rounded-xl border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">{prefStats.totalProfiles || 0}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">Total Profiles</div>
                   </div>
                   <div className="p-4 bg-white/50 dark:bg-[#0B1220]/60 rounded-xl border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">₹{prefStats.averageBudget?.toLocaleString() || 0}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">Avg Budget Intent</div>
                   </div>
                   <div className="p-4 bg-white/50 dark:bg-[#0B1220]/60 rounded-xl border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">{Object.keys(prefStats.popularConciergeIntents || {}).length}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">Unique AI Intents</div>
                   </div>
                   <div className="p-4 bg-white/50 dark:bg-[#0B1220]/60 rounded-xl border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-center">
                      <div className="text-2xl font-bold text-[#D4AF37]">{Object.keys(prefStats.popularRecipients || {}).length}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[#6B7280]">Gift Target Types</div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <h3 className="text-sm font-bold text-[#111827] dark:text-[#F5F5F5] mb-4 uppercase tracking-widest">Popular Concierge Intents</h3>
                      <div className="flex flex-col gap-2">
                        {Object.entries(prefStats.popularConciergeIntents || {}).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([intent, count]) => (
                           <div key={intent} className="flex justify-between items-center bg-white/50 dark:bg-[#0B1220]/60 p-3 rounded-lg">
                              <span className="text-sm capitalize">{intent}</span>
                              <span className="text-[#D4AF37] font-bold text-xs">{count}</span>
                           </div>
                        ))}
                      </div>
                   </div>
                   <div>
                      <h3 className="text-sm font-bold text-[#111827] dark:text-[#F5F5F5] mb-4 uppercase tracking-widest">Gift Recipients</h3>
                      <div className="flex flex-col gap-2">
                        {Object.entries(prefStats.popularRecipients || {}).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([recipient, count]) => (
                           <div key={recipient} className="flex justify-between items-center bg-white/50 dark:bg-[#0B1220]/60 p-3 rounded-lg">
                              <span className="text-sm capitalize">{recipient}</span>
                              <span className="text-[#D4AF37] font-bold text-xs">{count}</span>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
