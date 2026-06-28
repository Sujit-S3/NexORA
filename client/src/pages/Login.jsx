import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import MainLogo from '@components/common/MainLogo';
import FloatingInput from '@components/common/FloatingInput';
import AuthLayout from '@components/layout/AuthLayout';
import { motion } from 'framer-motion';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();
  
  useEffect(() => {
    if (error) clearError();
  }, []);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      const result = await login({ email: formData.email, password: formData.password });
      if (result && result.success) {
        const fallbackPath = result.user?.role === 'admin' ? '/admin' : '/';
        const from = location.state?.from?.pathname || fallbackPath;
        navigate(from, { replace: true });
      } else {
        setFormError(result?.message || 'Invalid credentials');
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
      console.error('Login failed', err);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-[rgba(255,255,255,0.75)] dark:bg-[rgba(255,255,255,0.08)] backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 md:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <MainLogo className="w-14 h-14" showText={true} textClassName="text-xl font-bold" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-[#1A1A1A] dark:text-[#F5F2E8] mt-6">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Sign in to your premium account</p>
        </div>

        {(error || formError) && (
          <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl text-center backdrop-blur-sm">
            {error || formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <FloatingInput 
            label="Email Address" 
            type="email" 
            id="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
          />
          
          <FloatingInput 
            label="Password" 
            type="password" 
            id="password" 
            value={formData.password} 
            onChange={handleChange} 
            required 
          />

          <div className="flex justify-end mb-6 -mt-2">
            <Link to="/forgot-password" className="text-sm font-medium text-[#D4AF37] hover:text-[#B38945] transition-colors">
              Forgot password?
            </Link>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white font-bold tracking-wide shadow-[0_10px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_25px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In To NEXORA'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-[#1A1A1A] dark:text-[#F5F2E8] hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors">
              Join NEXORA
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
