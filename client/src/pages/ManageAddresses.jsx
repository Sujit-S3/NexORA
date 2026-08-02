// NexORA — Saved Addresses
import { useState, useEffect } from 'react';
import { userService } from '@services/userService';
import FloatingInput from '@components/common/FloatingInput';
import { MapPin, Star, Trash2, Plus, X } from 'lucide-react';

const EMPTY_FORM = { label: 'Home', street: '', city: '', state: '', zip: '', country: 'India' };

const ManageAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadAddresses = async () => {
    try {
      const { data } = await userService.getAddresses();
      setAddresses(data.data || []);
    } catch {
      setError('Failed to load addresses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAddresses(); }, []);

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { data } = await userService.addAddress(form);
      setAddresses(data.data);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add address.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    setBusyId(id);
    try {
      const { data } = await userService.updateAddress(id, { isDefault: true });
      setAddresses(data.data);
    } catch {
      setError('Failed to update address.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    setBusyId(id);
    try {
      const { data } = await userService.deleteAddress(id);
      setAddresses(data.data);
    } catch {
      setError('Failed to delete address.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Saved Addresses</h1>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-full font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Add Address
            </button>
          )}
        </div>

        {error && <div role="alert" className="mb-6 px-4 py-3 rounded-lg text-sm bg-red-500/10 text-red-500 border border-red-500/20">{error}</div>}

        {showForm && (
          <div className="glass-panel p-8 mb-6 relative">
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }} aria-label="Cancel" className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
            <form onSubmit={handleAdd}>
              <FloatingInput id="addr-label" label="Label (e.g. Home, Office)" value={form.label} onChange={handleChange('label')} />
              <FloatingInput id="addr-street" label="Street Address" value={form.street} onChange={handleChange('street')} required />
              <div className="grid grid-cols-2 gap-4">
                <FloatingInput id="addr-city" label="City" value={form.city} onChange={handleChange('city')} required />
                <FloatingInput id="addr-state" label="State" value={form.state} onChange={handleChange('state')} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FloatingInput id="addr-zip" label="Zip Code" value={form.zip} onChange={handleChange('zip')} required />
                <FloatingInput id="addr-country" label="Country" value={form.country} onChange={handleChange('country')} required />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 text-[12px] font-bold tracking-widest uppercase bg-[#D4AF37] text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Address'}
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Loading…</p>
        ) : addresses.length === 0 && !showForm ? (
          <div className="glass-panel p-10 text-center">
            <MapPin className="w-10 h-10 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">No saved addresses yet. Add one to speed up checkout.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {addresses.map((addr) => (
              <div key={addr._id} className="glass-panel p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#111827] dark:text-[#F5F5F5]">{addr.label || 'Address'}</h3>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                    {addr.street}, {addr.city}, {addr.state} {addr.zip}, {addr.country}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!addr.isDefault && (
                    <button
                      onClick={() => handleSetDefault(addr._id)}
                      disabled={busyId === addr._id}
                      className="text-xs font-medium text-[#D4AF37] hover:underline disabled:opacity-50"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr._id)}
                    disabled={busyId === addr._id}
                    aria-label={`Delete ${addr.label || 'address'}`}
                    className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAddresses;
