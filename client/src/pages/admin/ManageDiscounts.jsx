import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, Copy, ToggleLeft, ToggleRight, Ticket } from 'lucide-react';
import Spinner from '@components/common/Spinner';
import api from '@services/api';

const EMPTY_FORM = {
  code: '', description: '', discountType: 'percentage', discountValue: '',
  minOrderAmount: '', maxDiscountAmount: '', usageLimit: '', expiryDate: '', isActive: true,
};

const ManageDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(null);

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/discounts');
      setDiscounts(res.data.data || []);
    } catch { alert('Failed to load discounts'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setForm(f => ({ ...f, code }));
  };

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      code: c.code, description: c.description || '', discountType: c.discountType,
      discountValue: c.discountValue, minOrderAmount: c.minOrderAmount || '',
      maxDiscountAmount: c.maxDiscountAmount || '',
      usageLimit: c.usageLimit || '', isActive: c.isActive,
      expiryDate: c.expiryDate ? c.expiryDate.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discountValue) return alert('Code and discount value are required');
    if (form.discountType === 'percentage' && Number(form.discountValue) > 100) return alert('Percentage cannot exceed 100%');
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.usageLimit) delete payload.usageLimit;
      if (!payload.expiryDate) delete payload.expiryDate;
      if (!payload.minOrderAmount) payload.minOrderAmount = 0;
      if (!payload.maxDiscountAmount) delete payload.maxDiscountAmount;

      if (editingId) await api.put(`/discounts/${editingId}`, payload);
      else await api.post('/discounts', payload);
      setShowForm(false);
      fetch();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save discount'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this discount?')) return;
    try { await api.delete(`/discounts/${id}`); fetch(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const toggleActive = async (discount) => {
    try { await api.put(`/discounts/${discount._id}`, { isActive: !discount.isActive }); fetch(); }
    catch { alert('Failed to update status'); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const isExpired = (date) => date && new Date() > new Date(date);

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Discounts</h1>
            <p className="text-sm text-gray-500 mt-1">{discounts.filter(c => c.isActive).length} active codes</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white text-sm font-medium shadow-lg hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all">
            <Plus className="w-4 h-4" /> Create Discount
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="glass-panel p-6 mb-8 border border-[#D4AF37]/30">
            <h2 className="text-lg font-bold text-[#111827] dark:text-[#F5F5F5] mb-5">{editingId ? 'Edit Discount' : 'New Discount'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
              {/* Code */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={form.code} maxLength={20}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="flex-1 px-3 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 text-sm font-mono uppercase"
                    placeholder="SAVE20"
                  />
                  <button onClick={generateCode} className="px-3 py-2 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium hover:bg-[#D4AF37]/20 transition-colors whitespace-nowrap">
                    Generate
                  </button>
                </div>
              </div>
              {/* Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Type *</label>
                <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none text-sm">
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              {/* Value */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                  Discount {form.discountType === 'percentage' ? '(%)' : '(Value)'} *
                </label>
                <input type="number" min="0" value={form.discountValue}
                  onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none text-sm"
                  placeholder={form.discountType === 'percentage' ? '20' : '500'} />
              </div>
              {/* Min order */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Min Order Value</label>
                <input type="number" min="0" value={form.minOrderAmount}
                  onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none text-sm"
                  placeholder="0 = no minimum" />
              </div>
              {/* Usage limit */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Usage Limit</label>
                <input type="number" min="1" value={form.usageLimit}
                  onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none text-sm"
                  placeholder="Blank = unlimited" />
              </div>
              {/* Max Discount Cap */}
              {form.discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Max Discount Cap</label>
                  <input type="number" min="0" value={form.maxDiscountAmount}
                    onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none text-sm"
                    placeholder="e.g. 2000 (blank = no cap)" />
                </div>
              )}
              {/* Expiry */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Expiry Date</label>
                <input type="date" value={form.expiryDate}
                  onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none text-sm" />
              </div>
              {/* Description */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Description (internal note)</label>
                <input type="text" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none text-sm"
                  placeholder="e.g. Welcome discount for new users" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white text-sm font-medium disabled:opacity-50">
                {saving ? <Spinner size="sm" /> : <Check className="w-4 h-4" />} {saving ? 'Saving...' : 'Save Discount'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-300 dark:border-white/10 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}

        {/* Discounts Grid */}
        {discounts.length === 0 ? (
          <div className="glass-panel p-16 text-center flex flex-col items-center text-gray-500">
            <Ticket className="w-10 h-10 mb-3 text-[#D4AF37]/30" />
            <p>No discounts yet. Create your first discount code.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {discounts.map(c => (
              <div key={c._id} className={`glass-panel p-5 group border transition-all ${c.isActive && !isExpired(c.expiryDate) ? 'border-[#D4AF37]/20' : 'border-transparent opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyCode(c.code)}
                        className="font-mono text-lg font-bold text-[#D4AF37] hover:text-[#EAD29A] transition-colors tracking-widest">
                        {c.code}
                      </button>
                      <button onClick={() => copyCode(c.code)} className="text-gray-400 hover:text-[#D4AF37] transition-colors">
                        {copied === c.code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{c.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-[#D4AF37]/10 text-gray-400 hover:text-[#D4AF37] transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-sm font-bold bg-[#D4AF37]/10 text-[#D4AF37]">
                    {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `${c.discountValue} Value OFF`}
                  </span>
                  {isExpired(c.expiryDate) && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">Expired</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                  <div>Min: {c.minOrderAmount > 0 ? `${c.minOrderAmount} Value` : 'None'}</div>
                  <div>Used: {c.timesUsed}{c.usageLimit ? `/${c.usageLimit}` : ''}</div>
                  <div className="col-span-2">Expires: {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : 'Never'}</div>
                </div>

                <button onClick={() => toggleActive(c)}
                  className={`flex items-center gap-2 text-xs font-medium transition-colors ${c.isActive ? 'text-green-500' : 'text-gray-400'}`}>
                  {c.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  {c.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageDiscounts;
