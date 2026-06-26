import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import AuthLayout from '@components/layout/AuthLayout';
import MainLogo from '@components/common/MainLogo';
import FloatingInput from '@components/common/FloatingInput';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

export default function ForgotPassword() {
  const [email, setEmail]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [error, setError]         = useState('');
  const [devLink, setDevLink]     = useState('');
  const [copied, setCopied]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
      // Development: server returns the reset link directly (no email configured)
      if (data?.data?.resetUrl) setDevLink(data.data.resetUrl);
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(devLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AuthLayout>
      <div className="bg-[rgba(255,255,255,0.75)] dark:bg-[rgba(255,255,255,0.08)] backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 md:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">

        <div className="flex flex-col items-center text-center mb-10">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
            <MainLogo className="w-14 h-14" showText={true} textClassName="text-xl font-bold" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-[#1A1A1A] dark:text-[#F5F2E8] mt-6">
            Reset Password
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Enter your email and we'll send a reset link
          </p>
        </div>

        {!sent ? (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FloatingInput
                label="Email Address"
                type="email"
                id="forgot-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white font-bold tracking-wide shadow-[0_10px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_25px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                {loading ? 'Sending…' : 'Send Reset Link'}
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-[#1A1A1A] dark:text-[#F5F2E8] mb-2">Check your email</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              If an account exists for <span className="text-[#D4AF37] font-medium">{email}</span>, a password reset link has been sent.
            </p>

            {/* Development mode: show link directly since email isn't configured */}
            {devLink && (
              <div className="mb-6 p-4 bg-amber-50/50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-xl text-left">
                <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold mb-2">
                  ⚡ Dev Mode — No Email Configured
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 break-all">{devLink}</p>
                <div className="flex gap-2">
                  <button onClick={copyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-xs rounded-lg hover:bg-[#D4AF37]/30 transition-colors">
                    <Copy size={12} /> {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <a href={devLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] text-black text-xs font-bold rounded-lg hover:bg-white transition-colors">
                    <ExternalLink size={12} /> Open Link
                  </a>
                </div>
              </div>
            )}

            <button onClick={() => { setSent(false); setEmail(''); setDevLink(''); }}
              className="text-sm text-[#D4AF37] hover:text-[#B38945] transition-colors">
              Try a different email
            </button>
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
