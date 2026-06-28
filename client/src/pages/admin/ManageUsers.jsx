import { useState, useEffect } from 'react';
import { userService } from '@services/userService';
import Spinner from '@components/common/Spinner';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data.data);
    } catch (err) {
      alert('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;
    try {
      await userService.updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userService.deleteUser(userId);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="min-h-screen flex justify-center items-center bg-transparent"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] mb-0 tracking-tight">Manage Users</h1>
      </div>

      <div className="glass-panel p-6">
        <div className="mb-6">
          <input 
            type="text" 
            placeholder="Search users by name or email..." 
            className="w-full max-w-md px-4 py-2 bg-white/50 dark:bg-[#0B1220]/60 backdrop-blur-md border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#6B7280] dark:text-[#9CA3AF]">
            <thead className="text-xs uppercase bg-[#D4AF37]/10 dark:bg-white/5 text-[#D4AF37] dark:text-[#F5F5F5]">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id} className="border-b border-gray-200/50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-[#111827] dark:text-[#F5F5F5] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center font-bold uppercase shrink-0">
                      {user.name.charAt(0)}
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <select 
                      className="text-sm bg-transparent border-gray-200 dark:border-white/10 rounded p-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-[#111827] dark:text-[#F5F5F5] outline-none"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    >
                      <option value="user" className="text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1A1A1A]">User</option>
                      <option value="admin" className="text-[#D4AF37] font-bold bg-white dark:bg-[#1A1A1A]">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(user._id)} 
                      disabled={user.role === 'admin'}
                      className={`font-medium hover:underline ${user.role === 'admin' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500'}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan="5" className="px-6 py-8 text-center">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ManageUsers;
