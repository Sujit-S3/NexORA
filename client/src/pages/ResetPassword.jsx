import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import AuthLayout from '@components/layout/AuthLayout';
import MainLogo from '@components/common/MainLogo';
import axios from 'axios';
import { useAuth } from '@hooks/useAuth';

const API = import.meta.env.VITE_API_URL || '/api';

export default function ResetPassword() {
  const { token }         = useParams();
  const navigate          = useNavigate();
  const { loginWithData } = useAuth();

  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');

    try {
      const { data } = await axios.post(`${API}/auth/reset-password/${token}`, { password });
      if (data?.success) {
        setSuccess(true);
        // Auto-login with returned user data
        if (data.data?.token && data.data?.user) {
          loginWithData?.(data.data.token, data.data.user);
        }
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired reset link. Please request a new one.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-[rgba(255,255,255,0.75)] dark:bg-[rgba(255,255,255,0.08)] backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 md:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">

        <div className="flex flex-col items-center text-center mb-10">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
            <MainLogo className="w-14 h-14" showText={true} textClassName="text-xl font-bold" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-[#1A1A1A] dark:text-[#F5F2E8] mt-6">
            New Password
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Create a strong new password for your account
          </p>
        </div>

        {!success ? (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl text-center">
                {error}
                {error.includes('expired') && (
                  <div className="mt-2">
                    <Link to="/forgot-password" className="text-[#D4AF37] underline text-xs">Request a new link</Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Password field with show/hide */}
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  id="new-password"
                  placeholder="New Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-[#0B0B0B] border border-gray-200 dark:border-[#1A1A1A] focus:border-[#D4AF37]/50 rounded-xl py-4 pl-5 pr-12 text-gray-900 dark:text-white outline-none transition-all text-[15px]"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                id="confirm-password"
                placeholder="Confirm New Password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="w-full bg-white dark:bg-[#0B0B0B] border border-gray-200 dark:border-[#1A1A1A] focus:border-[#D4AF37]/50 rounded-xl py-4 pl-5 pr-5 text-gray-900 dark:text-white outline-none transition-all text-[15px]"
              />

              {/* Password strength bar */}
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                    password.length === 0 ? 'bg-gray-200 dark:bg-[#222]' :
                    password.length < 6  ? (i <= 1 ? 'bg-red-400' : 'bg-gray-200 dark:bg-[#222]') :
                    password.length < 10 ? (i <= 2 ? 'bg-amber-400' : 'bg-gray-200 dark:bg-[#222]') :
                    password.length < 14 ? (i <= 3 ? 'bg-[#D4AF37]' : 'bg-gray-200 dark:bg-[#222]') :
                    'bg-emerald-400'
                  }`} />
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white font-bold tracking-wide shadow-[0_10px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_25px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
              >
                <Lock size={16} />
                {loading ? 'Resetting…' : 'Reset Password'}
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#F5F2E8] mb-2">Password Reset!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your password has been updated. Signing you in…
            </p>
          </motion.div>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-[#D4AF37] transition-colors">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
