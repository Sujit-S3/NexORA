// NexORA — Premium User Profile Dashboard
import { useAuth } from '@context/AuthContext';
import { Link } from 'react-router-dom';
import MainLogo from '@components/common/MainLogo';
import { ShoppingBag, Heart, MapPin, CreditCard, Settings, LogOut } from 'lucide-react';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-transparent min-h-screen pt-32 pb-20">
      <div className="container-app max-w-6xl">
        
        {/* User Header */}
        <div className="glass-panel p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-[#D4AF37]/10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-24 h-24 rounded-full bg-white/10 dark:bg-[#0B1220]/60 backdrop-blur-md border border-gray-200/50 dark:border-[rgba(212,175,55,0.2)] flex items-center justify-center p-4 shadow-lg">
              <MainLogo className="w-16 h-16" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-[#111827] dark:text-[#F5F5F5] tracking-tight">{user?.name}</h1>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] mb-2">{user?.email}</p>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#B38945] text-white text-xs font-semibold tracking-wider uppercase">
                {user?.role === 'admin' ? 'Admin Executive' : 'VIP Member'}
              </div>
            </div>
          </div>

          <button 
            onClick={logout}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 dark:bg-[#0B1220]/60 border border-gray-200/50 dark:border-[rgba(212,175,55,0.15)] text-[#111827] dark:text-[#F5F5F5] rounded-full hover:shadow-[0_4px_20px_rgba(212,175,55,0.2)] hover:text-red-500 transition-all font-medium text-sm relative z-10 group"
          >
            <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" /> Sign Out
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/orders" className="glass-panel p-8 group hover:border-[#D4AF37]/50 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)] block">
            <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <ShoppingBag className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <h3 className="text-xl font-semibold text-[#111827] dark:text-[#F5F5F5] mb-2">My Orders</h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Track, return, or buy things again.</p>
          </Link>

          <Link to="/wishlist" className="glass-panel p-8 group hover:border-[#D4AF37]/50 transition-all duration-500 hover:shadow-[0_10px_30px_rgba(212,175,55,0.1)] block">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Heart className="w-6 h-6 text-pink-500" />
            </div>
            <h3 className="text-xl font-semibold text-[#111827] dark:text-[#F5F5F5] mb-2">Wishlist</h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Curate your personal luxury collection.</p>
          </Link>

          <div className="glass-panel p-8 opacity-70 border-dashed border-gray-300 dark:border-white/10 cursor-not-allowed">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
              <MapPin className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-[#111827] dark:text-[#F5F5F5] mb-2 flex items-center justify-between">
              Addresses <span className="text-xs font-medium px-2 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full">Soon</span>
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Manage delivery locations.</p>
          </div>

          <div className="glass-panel p-8 opacity-70 border-dashed border-gray-300 dark:border-white/10 cursor-not-allowed">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-[#111827] dark:text-[#F5F5F5] mb-2 flex items-center justify-between">
              Payment <span className="text-xs font-medium px-2 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full">Soon</span>
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Manage saved cards and methods.</p>
          </div>

          <div className="glass-panel p-8 opacity-70 border-dashed border-gray-300 dark:border-white/10 cursor-not-allowed">
            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
              <Settings className="w-6 h-6 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-[#111827] dark:text-[#F5F5F5] mb-2 flex items-center justify-between">
              Settings <span className="text-xs font-medium px-2 py-0.5 bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 rounded-full">Soon</span>
            </h3>
            <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">Account preferences and security.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
