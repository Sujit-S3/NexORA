import { useState, useEffect } from 'react';
import { Shield, Users, Crown, Trash2, UserCheck } from 'lucide-react';
import Spinner from '@components/common/Spinner';
import { userService } from '@services/userService';

const RolesPermissions = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data.data || []);
    } catch { alert('Failed to load users'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to ${newRole}?`)) return;
    try {
      await userService.updateUserRole(userId, newRole);
      fetch();
    } catch (err) { alert(err.response?.data?.message || 'Failed to update role'); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Permanently delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      fetch();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete user'); }
  };

  const admins = users.filter(u => u.role === 'admin');
  const customers = users.filter(u => u.role === 'user');
  const filtered = filter === 'admin' ? admins : filter === 'user' ? customers : users;

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Roles & Permissions</h1>
            <p className="text-sm text-gray-500 mt-1">Manage user access levels</p>
          </div>
        </div>

        {/* Role Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-panel p-5 border border-[#D4AF37]/20 text-center">
            <Crown className="w-8 h-8 text-[#D4AF37] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#111827] dark:text-[#F5F5F5]">{admins.length}</p>
            <p className="text-xs text-gray-500 mt-1">Admins</p>
          </div>
          <div className="glass-panel p-5 border border-blue-500/20 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#111827] dark:text-[#F5F5F5]">{customers.length}</p>
            <p className="text-xs text-gray-500 mt-1">Customers</p>
          </div>
          <div className="glass-panel p-5 text-center">
            <UserCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#111827] dark:text-[#F5F5F5]">{users.length}</p>
            <p className="text-xs text-gray-500 mt-1">Total Users</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {[['all', 'All Users'], ['admin', 'Admins Only'], ['user', 'Customers Only']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === val ? 'bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white shadow' : 'glass-panel text-gray-500 hover:text-[#111827] dark:hover:text-white'}`}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Users Table */}
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase bg-[#D4AF37]/10 text-[#D4AF37]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u._id} className="border-b border-gray-200/50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold uppercase text-sm shrink-0 ${u.role === 'admin' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-blue-500/10 text-blue-500'}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[#111827] dark:text-[#F5F5F5]">{u.name}</p>
                          {u.role === 'admin' && <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Staff</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${u.role === 'admin' ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-blue-500 bg-blue-500/10'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRoleChange(u._id, u.role === 'admin' ? 'user' : 'admin')}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${u.role === 'admin' ? 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10' : 'bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20'}`}>
                          {u.role === 'admin' ? '↓ Demote' : '↑ Make Admin'}
                        </button>
                        <button onClick={() => handleDelete(u._id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;
