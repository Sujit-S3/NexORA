import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, ShoppingBag, Users, Package, ArrowUp, ArrowDown } from 'lucide-react';
import Spinner from '@components/common/Spinner';
import { adminService } from '@services/adminService';

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminService.getDashboardStats();
        setStats(res.data.data);
      } catch { alert('Failed to load reports'); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;

  const summaryCards = [
    { label: 'Total Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-green-500 bg-green-500/10 border-green-500/20' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    { label: 'Total Customers', value: stats?.totalUsers || 0, icon: Users, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20' },
  ];

  // Build bar chart data from top products
  const maxSold = stats?.topProducts?.reduce((m, p) => Math.max(m, p.sold || 1), 1) || 1;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Reports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Store performance overview</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} className={`glass-panel p-5 border ${c.color.split(' ')[2]}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.color.split(' ').slice(1).join(' ')}`}>
                  <Icon className={`w-5 h-5 ${c.color.split(' ')[0]}`} />
                </div>
                <p className="text-2xl font-bold text-[#111827] dark:text-[#F5F5F5]">{c.value}</p>
                <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top Products Bar Chart */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-[#111827] dark:text-[#F5F5F5] mb-6 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#D4AF37]" /> Top Selling Products
            </h2>
            {stats?.topProducts?.length > 0 ? (
              <div className="space-y-4">
                {stats.topProducts.map((p, i) => (
                  <div key={p._id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#D4AF37] w-5">#{i + 1}</span>
                        <span className="text-sm font-medium text-[#111827] dark:text-[#F5F5F5] truncate max-w-[180px]">{p.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{p.sold || 0} sold</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#B38945] rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(5, ((p.sold || 1) / maxSold) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No sales data available yet.</p>
            )}
          </div>

          {/* Order Status Breakdown */}
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-[#111827] dark:text-[#F5F5F5] mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" /> Order Status Breakdown
            </h2>
            {stats?.ordersByStatus && Object.keys(stats.ordersByStatus).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                  const total = Object.values(stats.ordersByStatus).reduce((a, b) => a + b, 0) || 1;
                  const pct = Math.round((count / total) * 100);
                  const colors = {
                    pending: 'bg-yellow-500', processing: 'bg-blue-500',
                    shipped: 'bg-indigo-500', delivered: 'bg-green-500', cancelled: 'bg-red-500'
                  };
                  return (
                    <div key={status}>
                      <div className="flex justify-between mb-1 text-sm">
                        <span className="capitalize font-medium text-[#111827] dark:text-[#F5F5F5]">{status}</span>
                        <span className="text-gray-500">{count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${colors[status] || 'bg-gray-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No order data available.</p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        {stats?.recentOrders?.length > 0 && (
          <div className="glass-panel p-6">
            <h2 className="text-lg font-bold text-[#111827] dark:text-[#F5F5F5] mb-5 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" /> Recent Orders
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-[#D4AF37]/10 text-[#D4AF37]">
                  <tr>
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(o => (
                    <tr key={o._id} className="border-b border-gray-200/50 dark:border-white/5">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.orderNumber}</td>
                      <td className="px-4 py-3 font-medium text-[#111827] dark:text-[#F5F5F5]">{o.user?.name || '—'}</td>
                      <td className="px-4 py-3 font-bold text-[#111827] dark:text-[#F5F5F5]">₹{o.totalPrice?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 capitalize text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] font-medium">{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
