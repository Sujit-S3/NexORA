// NexORA V7 — Executive Admin Dashboard

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminService } from '@services/adminService';
import { Users, Package, ShoppingBag, IndianRupee, TrendingUp, AlertCircle, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Force dark mode for Executive Admin Suite
    document.documentElement.classList.add('dark');
    
    adminService.getDashboardStats()
      .then(res => setStats(res.data.data))
      .catch(err => setError('Failed to load executive statistics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen pt-32 flex justify-center bg-[#050505]"><div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div></div>;
  if (error) return <div className="min-h-screen pt-32 text-center text-red-500 bg-[#050505]">{error}</div>;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0B0B0B]/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl">
          <p className="text-[#9CA3AF] text-[10px] font-bold tracking-widest uppercase mb-2">{label}</p>
          <p className="text-white font-mono text-lg">${payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const ExecutiveCard = ({ title, value, icon: Icon, delay }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }} className="relative p-6 rounded-2xl overflow-hidden group" style={{ background: '#0B0B0B', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="absolute -right-6 -top-6 text-white/5 transition-transform duration-700 group-hover:scale-110">
        <Icon size={120} />
      </div>
      <div className="relative z-10 flex justify-between items-start mb-8">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#9CA3AF]">{title}</p>
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
          <Icon size={18} className="text-[#D4AF37]" />
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-playfair tracking-tight text-white">{value}</h3>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-28 pb-20 font-jakarta text-white bg-[#050505]">
      <div className="container-app max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.2em] uppercase mb-4" style={{ background: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Sparkles size={12} /> Executive Control
            </div>
            <h1 className="text-4xl md:text-5xl font-playfair tracking-tight">Global Performance</h1>
          </div>
          <div className="flex gap-4">
            <Link to="/admin/reports" className="px-6 py-3 text-[11px] font-bold tracking-widest uppercase rounded bg-white/5 hover:bg-white/10 transition-colors border border-white/10">Generate Report</Link>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <ExecutiveCard title="Gross Revenue" value={`$${stats?.totalRevenue?.toLocaleString() || 0}`} icon={TrendingUp} delay={0.1} />
          <ExecutiveCard title="Total Orders" value={stats?.totalOrders || 0} icon={ShoppingBag} delay={0.2} />
          <ExecutiveCard title="Active Users" value={stats?.totalUsers || 0} icon={Users} delay={0.3} />
          <ExecutiveCard title="Active Listings" value={stats?.totalProducts || 0} icon={Package} delay={0.4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Main Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="lg:col-span-2 p-8 rounded-2xl" style={{ background: '#0B0B0B', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#9CA3AF] mb-8">Revenue Trajectory</h2>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.charts?.revenueByMonth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280', fontFamily: 'monospace' }} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#goldGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* User Growth */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }} className="p-8 rounded-2xl" style={{ background: '#0B0B0B', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#9CA3AF] mb-8">User Acquisition</h2>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.charts?.usersByMonth || []} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(212,175,55,0.1)' }} />
                  <Bar dataKey="users" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Critical Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }} className="p-8 rounded-2xl" style={{ background: '#0B0B0B', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#9CA3AF]">Fulfillment Status</h2>
              <Link to="/admin/orders" className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:underline flex items-center gap-1">View Queue <ChevronRight size={12} /></Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-xl border border-orange-500/20 bg-orange-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                  <p className="text-[11px] font-bold tracking-widest uppercase text-orange-400">Pending</p>
                </div>
                <p className="text-3xl font-playfair text-white">{stats?.pendingOrders || 0}</p>
              </div>
              <div className="p-6 rounded-xl border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <p className="text-[11px] font-bold tracking-widest uppercase text-green-400">Dispatched</p>
                </div>
                <p className="text-3xl font-playfair text-white">{stats?.completedOrders || 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }} className="p-8 rounded-2xl" style={{ background: '#0B0B0B', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-[12px] font-bold tracking-[0.2em] uppercase text-[#9CA3AF]">Low Inventory Alerts</h2>
              <Link to="/admin/products" className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:underline flex items-center gap-1">Manage <ChevronRight size={12} /></Link>
            </div>
            {stats?.lowStockProducts?.length > 0 ? (
              <div className="space-y-4">
                {stats.lowStockProducts.slice(0, 3).map(p => (
                  <div key={p._id} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-[13px] font-medium truncate">{p.name}</p>
                    <span className="text-[11px] font-bold font-mono text-red-400">{p.stock} left</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-[13px] text-[#6B7280]">Inventory levels are stable. No alerts.</div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
