import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import MainLogo from '@components/common/MainLogo';
import FloatingInput from '@components/common/FloatingInput';
import AuthLayout from '@components/layout/AuthLayout';
import { motion } from 'framer-motion';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading, error, clearError } = useAuth();
  
  useEffect(() => {
    if (error) clearError();
  }, []);
  
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', 
    mobile: '', countryCode: '+91', currency: 'INR' 
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    if (formError) setFormError('');
  };

  const handleCountryChange = (e) => {
    const code = e.target.value;
    let newCurrency = 'INR';
    if (code === '+1') newCurrency = 'USD';
    if (code === '+44') newCurrency = 'GBP';
    if (code === '+971') newCurrency = 'AED';
    if (code === '+49' || code === '+33') newCurrency = 'EUR';
    
    setFormData(prev => ({ ...prev, countryCode: code, currency: newCurrency }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Please fill in all fields');
      return;
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    try {
      const result = await register({ 
        name: formData.name, 
        email: formData.email, 
        password: formData.password,
        mobile: formData.mobile,
        countryCode: formData.countryCode,
        currency: formData.currency
      });
      if (result && result.success) {
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        setFormError(result?.message || 'Registration failed');
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
      console.error('Registration failed', err);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-[rgba(255,255,255,0.75)] dark:bg-[rgba(255,255,255,0.08)] backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 md:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
        
        <div className="flex flex-col items-center text-center mb-10">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <MainLogo className="w-14 h-14" showText={true} textClassName="text-xl font-bold" />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-[#1A1A1A] dark:text-[#F5F2E8] mt-6">Create account</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">Join the curated ecosystem</p>
        </div>

        {(error || formError) && (
          <div className="mb-6 p-4 bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl text-center backdrop-blur-sm">
            {error || formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <FloatingInput 
            label="Full Name" 
            type="text" 
            id="name" 
            value={formData.name} 
            onChange={handleChange} 
            required 
          />

          <FloatingInput 
            label="Email Address" 
            type="email" 
            id="email" 
            value={formData.email} 
            onChange={handleChange} 
            required 
          />
          
          <div className="flex gap-2">
            <div className="w-1/3">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 px-1">Country</label>
              <select 
                id="countryCode" 
                value={formData.countryCode} 
                onChange={handleCountryChange}
                className="w-full px-4 py-3.5 rounded-xl bg-[#FDFBF7] dark:bg-white/5 border border-[#EBE0CF] dark:border-white/10 text-[#2C241B] dark:text-white transition-all duration-300 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="+91">India (+91)</option>
                <option value="+1">US/Canada (+1)</option>
                <option value="+44">UK (+44)</option>
                <option value="+971">UAE (+971)</option>
                <option value="+49">EU (+49)</option>
              </select>
            </div>
            <div className="w-2/3 mt-[18px]">
              <FloatingInput 
                label="Mobile Number" 
                type="tel" 
                id="mobile" 
                value={formData.mobile} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="w-full">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 px-1">Preferred Currency</label>
            <select 
              id="currency" 
              value={formData.currency} 
              onChange={handleChange}
              className="w-full px-5 py-3 rounded-xl bg-[#FDFBF7] dark:bg-white/5 border border-[#EBE0CF] dark:border-white/10 text-[#2C241B] dark:text-white transition-all duration-300 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="AED">AED (د.إ)</option>
            </select>
          </div>

          <FloatingInput 
            label="Password (min. 6 characters)" 
            type="password" 
            id="password" 
            value={formData.password} 
            onChange={handleChange} 
            required 
          />

          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white font-bold tracking-wide shadow-[0_10px_20px_rgba(212,175,55,0.3)] hover:shadow-[0_15px_25px_rgba(212,175,55,0.4)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Join NEXORA'}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#1A1A1A] dark:text-[#F5F2E8] hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
