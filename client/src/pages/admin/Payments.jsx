import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import Spinner from '@components/common/Spinner';
import api from '@services/api';

const statusStyles = {
  success: { label: 'Paid', cls: 'text-green-600 bg-green-500/10', icon: CheckCircle },
  pending: { label: 'Pending', cls: 'text-yellow-600 bg-yellow-500/10', icon: Clock },
  failed: { label: 'Failed', cls: 'text-red-500 bg-red-500/10', icon: XCircle },
};

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/payments');
        setPayments(res.data.data || []);
      } catch { alert('Failed to load payments'); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  const totalRevenue = payments.filter(p => p.status === 'success').reduce((a, p) => a + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((a, p) => a + p.amount, 0);
  const totalFailed = payments.filter(p => p.status === 'failed').length;

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Payments</h1>
            <p className="text-sm text-gray-500 mt-1">{payments.length} transactions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-panel p-5 border border-green-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-[#111827] dark:text-[#F5F5F5]">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
          <div className="glass-panel p-5 border border-yellow-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending</span>
            </div>
            <p className="text-2xl font-bold text-[#111827] dark:text-[#F5F5F5]">₹{totalPending.toLocaleString('en-IN')}</p>
          </div>
          <div className="glass-panel p-5 border border-red-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Failed</span>
            </div>
            <p className="text-2xl font-bold text-[#111827] dark:text-[#F5F5F5]">{totalFailed}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'success', 'pending', 'failed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${filter === f ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white shadow' : 'glass-panel text-gray-500 hover:text-[#111827] dark:hover:text-white'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-[#D4AF37]/10 dark:bg-white/5 text-[#D4AF37]">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const s = statusStyles[p.status] || statusStyles.pending;
                  const Icon = s.icon;
                  return (
                    <tr key={p._id} className="border-b border-gray-200/50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {p.transactionId || p._id.slice(-12).toUpperCase()}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-[#111827] dark:text-[#F5F5F5]">{p.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{p.user?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 capitalize">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5" />
                          {p.method || 'Online'}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#111827] dark:text-[#F5F5F5]">
                        ₹{p.amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.cls}`}>
                          <Icon className="w-3 h-3" />{s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;
