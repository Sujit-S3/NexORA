import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Folder, X, Check } from 'lucide-react';
import Spinner from '@components/common/Spinner';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API}/categories`, { headers: authHeader() });
      setCategories(res.data.data || res.data);
    } catch {
      alert('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', description: '' });
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setEditingId(cat._id);
    setForm({ name: cat.name, description: cat.description || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert('Category name is required');
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/categories/${editingId}`, form, { headers: authHeader() });
      } else {
        await axios.post(`${API}/categories`, form, { headers: authHeader() });
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category? Products in this category may be affected.')) return;
    try {
      await axios.delete(`${API}/categories/${id}`, { headers: authHeader() });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">
            Categories
          </h1>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white text-sm font-medium shadow-lg hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div className="glass-panel p-6 mb-8 border border-[#D4AF37]/30">
            <h2 className="text-lg font-bold text-[#111827] dark:text-[#F5F5F5] mb-4">
              {editingId ? 'Edit Category' : 'New Category'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all"
                  placeholder="e.g. Watches"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all"
                  placeholder="Short description..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white text-sm font-medium disabled:opacity-50 transition-all"
              >
                {saving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <div key={cat._id} className="glass-panel p-5 flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all border border-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                  <Folder className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="font-semibold text-[#111827] dark:text-[#F5F5F5]">{cat.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-3 glass-panel p-12 text-center text-gray-500">
              No categories found. Create your first category.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;
