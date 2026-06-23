import { useState, useEffect } from 'react';
import { adminService } from '@services/adminService';
import Spinner from '@components/common/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminService.getDashboardStats();
        setStats(res.data.data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) return <div className="min-h-[50vh] flex justify-center items-center"><Spinner size="lg" /></div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (!stats) return null;

  return (
    <div className="section container-app animate-fade-in">
      <h1 className="section-title mb-2">Admin Dashboard</h1>
      <p className="section-subtitle mb-8">Platform overview and analytics</p>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
          <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-1">₹{stats.kpis.totalRevenue}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
          <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-1">{stats.kpis.totalOrders}</p>
          <div className="mt-2 text-xs text-gray-500 flex gap-4">
            <span><span className="text-yellow-500 font-bold">{stats.kpis.pendingOrders}</span> pending</span>
            <span><span className="text-green-500 font-bold">{stats.kpis.deliveredOrders}</span> delivered</span>
          </div>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Products</p>
          <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-1">{stats.kpis.totalProducts}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Users</p>
          <p className="text-3xl font-display font-bold text-gray-900 dark:text-white mt-1">{stats.kpis.totalUsers}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Monthly Revenue (Last 6 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.charts.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.charts.usersByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Top Selling Products</h3>
          <div className="space-y-4">
            {stats.topProducts.map((p, i) => (
              <div key={p._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-400">{i + 1}</div>
                  <img src={p.images?.[0]?.url || 'https://via.placeholder.com/40'} alt={p.name} className="w-10 h-10 object-cover rounded" />
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">₹{p.price}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 dark:text-white">{p.sold} sold</p>
                  <p className="text-xs text-yellow-500 font-medium">★ {p.ratings?.average}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-gray-900 dark:text-white mb-6">Low Stock Alerts</h3>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">All products have sufficient stock.</p>
          ) : (
            <div className="space-y-4">
              {stats.lowStockProducts.map(p => (
                <div key={p._id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img src={p.images?.[0]?.url || 'https://via.placeholder.com/40'} alt={p.name} className="w-10 h-10 object-cover rounded" />
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{p.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600 dark:text-red-400">{p.stock} left</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
