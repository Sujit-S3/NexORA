// NexORA — Account Settings
import { useState, useRef } from 'react';
import { useAuth } from '@context/AuthContext';
import { userService } from '@services/userService';
import FloatingInput from '@components/common/FloatingInput';
import MainLogo from '@components/common/MainLogo';
import { Camera, Loader2 } from 'lucide-react';

const CURRENCIES = ['INR', 'USD', 'GBP', 'EUR', 'AED'];

const AccountSettings = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    mobile: user?.mobile || '',
    countryCode: user?.countryCode || '+91',
    currency: user?.currency || 'INR',
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const { data } = await userService.updateProfile(form);
      updateUser(data.data);
      setMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setUploadingAvatar(true);
    try {
      const { data } = await userService.uploadAvatar(file);
      updateUser(data.data);
      setMessage({ type: 'success', text: 'Avatar updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload avatar.' });
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app max-w-2xl">
        <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight mb-8">Account Settings</h1>

        <div className="glass-panel p-10">
          {/* Avatar */}
          <div className="flex items-center gap-6 mb-10">
            <div className="w-20 h-20 rounded-full bg-white/10 dark:bg-[#0B1220]/60 backdrop-blur-md border border-gray-200/50 dark:border-[rgba(212,175,55,0.2)] flex items-center justify-center overflow-hidden shrink-0">
              {user?.avatar?.url ? (
                <img src={user.avatar.url} alt="Your avatar" className="w-full h-full object-cover" />
              ) : (
                <MainLogo className="w-10 h-10" />
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-full hover:border-[#D4AF37]/50 transition-all font-medium text-sm disabled:opacity-50"
              >
                {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {uploadingAvatar ? 'Uploading…' : 'Change Avatar'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleAvatarSelect} className="hidden" />
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-2">JPEG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>

          {message && (
            <div
              role="alert"
              className={`mb-6 px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FloatingInput id="settings-name" label="Full Name" value={form.name} onChange={handleChange('name')} required minLength={2} maxLength={50} />
            <div className="grid grid-cols-2 gap-4">
              <FloatingInput id="settings-country-code" label="Country Code" value={form.countryCode} onChange={handleChange('countryCode')} placeholder="+91" />
              <FloatingInput id="settings-mobile" label="Mobile Number" value={form.mobile} onChange={handleChange('mobile')} />
            </div>

            <div className="mb-6">
              <label htmlFor="settings-currency" className="block text-xs text-gray-500 dark:text-gray-400 mb-2">Preferred Currency</label>
              <select
                id="settings-currency"
                value={form.currency}
                onChange={handleChange('currency')}
                className="w-full bg-white/40 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white backdrop-blur-md outline-none focus:border-[#D4AF37] transition-all"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 text-[12px] font-bold tracking-widest uppercase bg-[#D4AF37] text-black rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
