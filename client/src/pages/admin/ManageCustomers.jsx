import { useState, useEffect } from 'react';
import { Search, Users, Mail, Calendar, ShoppingBag } from 'lucide-react';
import Spinner from '@components/common/Spinner';
import { userService } from '@services/userService';

const ManageCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await userService.getAllUsers();
        const all = res.data.data || [];
        setCustomers(all.filter(u => u.role === 'user'));
      } catch {
        alert('Failed to load customers');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Customers</h1>
          <div className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 rounded-full text-[#D4AF37] text-sm font-semibold">
            <Users className="w-4 h-4" />
            {customers.length} Total
          </div>
        </div>

        {/* Search */}
        <div className="glass-panel p-4 mb-6 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            className="flex-1 bg-transparent text-[#111827] dark:text-[#F5F5F5] placeholder-gray-400 focus:outline-none text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-[#D4AF37]/10 dark:bg-white/5 text-[#D4AF37] dark:text-[#D4AF37]">
                <tr>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4 text-right">Orders</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id} className="border-b border-gray-200/50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center font-bold uppercase text-sm">
                          {c.name.charAt(0)}
                        </div>
                        <span className="font-medium text-[#111827] dark:text-[#F5F5F5]">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5" />
                        {c.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-gray-500 dark:text-gray-400">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {c.ordersCount ?? '—'}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="4" className="px-6 py-10 text-center text-gray-500">No customers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCustomers;
