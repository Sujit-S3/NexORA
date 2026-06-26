import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, Truck, MapPin } from 'lucide-react';
import Spinner from '@components/common/Spinner';
import api from '@services/api';

const EMPTY_FORM = { name: '', regions: '', baseRate: '', freeShippingThreshold: '', estimatedDays: '3-7 business days', isActive: true };

const Shipping = () => {
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/shipping');
      setZones(res.data.data || []);
    } catch { alert('Failed to load shipping zones'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (z) => {
    setEditingId(z._id);
    setForm({ ...z, regions: z.regions?.join(', ') || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || form.baseRate === '') return alert('Name and base rate are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        regions: form.regions.split(',').map(r => r.trim()).filter(Boolean),
        baseRate: Number(form.baseRate),
        freeShippingThreshold: form.freeShippingThreshold ? Number(form.freeShippingThreshold) : null,
      };
      if (editingId) await api.put(`/shipping/${editingId}`, payload);
      else await api.post('/shipping', payload);
      setShowForm(false);
      fetch();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save zone'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shipping zone?')) return;
    try { await api.delete(`/shipping/${id}`); fetch(); }
    catch { alert('Failed to delete zone'); }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Shipping Zones</h1>
            <p className="text-sm text-gray-500 mt-1">Configure delivery zones and rates</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white text-sm font-medium shadow-lg hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all">
            <Plus className="w-4 h-4" /> Add Zone
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="glass-panel p-6 mb-8 border border-[#D4AF37]/30">
            <h2 className="text-lg font-bold text-[#111827] dark:text-[#F5F5F5] mb-5">{editingId ? 'Edit Zone' : 'New Shipping Zone'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {[
                { key: 'name', label: 'Zone Name *', placeholder: 'e.g. Metro Cities' },
                { key: 'estimatedDays', label: 'Estimated Delivery', placeholder: '3-7 business days' },
                { key: 'baseRate', label: 'Base Rate (₹) *', placeholder: '99', type: 'number' },
                { key: 'freeShippingThreshold', label: 'Free Shipping Above (₹)', placeholder: 'Leave blank = no free shipping', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{f.label}</label>
                  <input type={f.type || 'text'} value={form[f.key]} placeholder={f.placeholder}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-sm" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Regions (comma separated)</label>
                <input type="text" value={form.regions} placeholder="Mumbai, Delhi, Bangalore, Chennai"
                  onChange={e => setForm(p => ({ ...p, regions: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-sm" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white text-sm font-medium disabled:opacity-50">
                {saving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />} {saving ? 'Saving...' : 'Save Zone'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Zones List */}
        {zones.length === 0 && !showForm ? (
          <div className="glass-panel p-16 text-center flex flex-col items-center text-gray-500">
            <Truck className="w-10 h-10 mb-3 text-[#D4AF37]/30" />
            <p>No shipping zones configured. Add your first zone.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {zones.map(z => (
              <div key={z._id} className="glass-panel p-5 group hover:border-[#D4AF37]/20 border border-transparent transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
                      <Truck className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="font-bold text-[#111827] dark:text-[#F5F5F5]">{z.name}</p>
                      <p className="text-xs text-gray-500">{z.estimatedDays}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(z)} className="p-1.5 rounded-lg hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(z._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm mb-3">
                  <span className="font-bold text-[#111827] dark:text-[#F5F5F5]">₹{z.baseRate} base rate</span>
                  {z.freeShippingThreshold && (
                    <span className="text-green-500 text-xs">Free above ₹{z.freeShippingThreshold}</span>
                  )}
                </div>
                {z.regions?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {z.regions.map(r => (
                      <span key={r} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-xs text-gray-500">
                        <MapPin className="w-2.5 h-2.5" />{r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shipping;
