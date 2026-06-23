// NexORA — Register Page

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { APP_NAME } from '@utils/constants';
import { useAuth } from '@hooks/useAuth';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Where to navigate after register
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    const result = await register(formData);
    setIsLoading(false);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl items-center justify-center text-white text-2xl font-black shadow-glow mb-4">N</div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Create account</h1>
            <p className="text-gray-500 mt-1 text-sm">Join {APP_NAME} today</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 text-center">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label label-required">Full Name</label>
              <input 
                type="text" 
                name="name"
                className="input" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="label label-required">Email</label>
              <input 
                type="email" 
                name="email"
                className="input" 
                placeholder="you@example.com" 
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="label label-required">Password</label>
              <input 
                type="password" 
                name="password"
                className="input" 
                placeholder="Min. 6 characters" 
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary w-full btn-lg" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
