import { useState, useEffect } from 'react';
import { Save, Store, Mail, Phone, DollarSign, Percent, Truck, Globe } from 'lucide-react';
import Spinner from '@components/common/Spinner';
import api from '@services/api';

const Field = ({ label, icon: Icon, type = 'text', value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
      <input
        type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 bg-white/50 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all text-sm`}
      />
    </div>
  </div>
);

const Settings = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/settings');
        setSettings(res.data.data);
      } catch { alert('Failed to load settings'); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const handleChange = (key, value) => setSettings(s => ({ ...s, [key]: value }));
  const handleSocial = (key, value) => setSettings(s => ({ ...s, socialLinks: { ...s.socialLinks, [key]: value } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { alert(err.response?.data?.message || 'Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (isLoading) return <div className="min-h-screen flex justify-center items-center"><Spinner size="lg" /></div>;
  if (!settings) return <div className="min-h-screen pt-32 text-center text-red-500">Failed to load settings (or you are rate-limited). Please try again later.</div>;

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">Store Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Configure your store&apos;s global configuration</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium shadow-lg transition-all disabled:opacity-50 ${saved ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)]'}`}>
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Store Identity */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-bold text-[#111827] dark:text-[#F5F5F5] mb-5 flex items-center gap-2">
              <Store className="w-4 h-4 text-[#D4AF37]" /> Store Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Store Name" icon={Store} value={settings.storeName} onChange={v => handleChange('storeName', v)} placeholder="NexORA" />
              <Field label="Tagline" value={settings.storeTagline} onChange={v => handleChange('storeTagline', v)} placeholder="Curated For You" />
            </div>
          </div>

          {/* Contact */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-bold text-[#111827] dark:text-[#F5F5F5] mb-5 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D4AF37]" /> Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Support Email" icon={Mail} type="email" value={settings.contactEmail} onChange={v => handleChange('contactEmail', v)} placeholder="hello@nexora.com" />
              <Field label="Support Phone" icon={Phone} value={settings.supportPhone} onChange={v => handleChange('supportPhone', v)} placeholder="+91 98765 43210" />
              <div className="md:col-span-2">
                <Field label="Store Address" value={settings.address} onChange={v => handleChange('address', v)} placeholder="123 Luxury Avenue, Mumbai" />
              </div>
            </div>
          </div>

          {/* Commerce */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-bold text-[#111827] dark:text-[#F5F5F5] mb-5 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#D4AF37]" /> Commerce Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Currency Code" icon={Globe} value={settings.currency} onChange={v => handleChange('currency', v)} placeholder="INR" />
              <Field label="Currency Symbol" value={settings.currencySymbol} onChange={v => handleChange('currencySymbol', v)} placeholder="₹" />
              <Field label="Tax Rate (%)" icon={Percent} type="number" value={settings.taxRate} onChange={v => handleChange('taxRate', v)} placeholder="18" />
              <Field label={`Free Shipping Above (${settings.currencySymbol || 'Base'})`} icon={Truck} type="number" value={settings.freeShippingThreshold} onChange={v => handleChange('freeShippingThreshold', v)} placeholder="999" />
            </div>
          </div>

          {/* Social */}
          <div className="glass-panel p-6">
            <h2 className="text-base font-bold text-[#111827] dark:text-[#F5F5F5] mb-5 flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#D4AF37]" /> Social Links
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Instagram" icon={Globe} value={settings.socialLinks?.instagram} onChange={v => handleSocial('instagram', v)} placeholder="https://instagram.com/nexora" />
              <Field label="Twitter / X" icon={Globe} value={settings.socialLinks?.twitter} onChange={v => handleSocial('twitter', v)} placeholder="https://twitter.com/nexora" />
              <Field label="Facebook" icon={Globe} value={settings.socialLinks?.facebook} onChange={v => handleSocial('facebook', v)} placeholder="https://facebook.com/nexora" />
            </div>
          </div>

          {/* Maintenance Mode */}
          <div className="glass-panel p-6 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-[#F5F5F5]">Maintenance Mode</h2>
              <p className="text-sm text-gray-500 mt-1">When enabled, the store will show a maintenance page to visitors.</p>
            </div>
            <button onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
              className={`w-14 h-7 rounded-full relative transition-colors ${settings.maintenanceMode ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${settings.maintenanceMode ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
