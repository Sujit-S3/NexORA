import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Package, Folder, FileText, Users, MessageSquare, Ticket, BarChart2,
  Shield, Settings, CreditCard, Truck, LogOut, ChevronRight, Sparkles, BrainCircuit
} from 'lucide-react';
import MainLogo from '@components/common/MainLogo';
import { useAuth } from '@context/AuthContext';

const SIDEBAR_MAIN = [
  { label: 'Executive Board', path: '/admin', icon: Home, end: true },
  { label: 'Catalog', path: '/admin/products', icon: Package },
  { label: 'Orders', path: '/admin/orders', icon: FileText },
  { label: 'Customers', path: '/admin/customers', icon: Users },
  { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
  { label: 'Discounts', path: '/admin/discounts', icon: Ticket },
  { label: 'Analytics', path: '/admin/reports', icon: BarChart2 },
];

const SIDEBAR_STORE = [
  { label: 'Staff & Users', path: '/admin/users', icon: Users },
  { label: 'Roles & Access', path: '/admin/roles', icon: Shield },
  { label: 'Payments', path: '/admin/payments', icon: CreditCard },
  { label: 'Shipping', path: '/admin/shipping', icon: Truck },
  { label: 'Store Settings', path: '/admin/settings', icon: Settings },
];

const SIDEBAR_AI = [
  { label: 'AI Studio', path: '/admin/ai-studio', icon: BrainCircuit, highlight: true },
];

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Force dark mode in Executive Admin
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const isActive = (path, end) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white overflow-hidden font-jakarta">
      
      {/* ── Executive Sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col bg-[#0B0B0B] border-r border-white/5 h-screen overflow-y-auto lux-scroll relative">
        
        {/* Subtle Gold Gradient Glow */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#D4AF37]/5 to-transparent pointer-events-none" />

        {/* Logo Area */}
        <div className="flex items-center gap-4 px-8 py-8 border-b border-white/5 relative z-10">
          <MainLogo className="w-8 h-8 drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]" showText={false} />
          <div className="flex flex-col">
            <span className="font-playfair tracking-widest text-white text-lg uppercase leading-none">NexORA</span>
            <span className="text-[8px] tracking-[0.3em] text-[#D4AF37] uppercase mt-1">Executive</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 py-6 px-4 space-y-8 relative z-10">
          
          {/* Main Section */}
          <div>
            <h4 className="text-[9px] font-bold text-[#6B7280] uppercase tracking-[0.2em] mb-4 px-4">Primary</h4>
            <nav className="space-y-1">
              {SIDEBAR_MAIN.map((item) => (
                <NavLink
                  key={item.label} to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 text-[12px] font-medium tracking-wide
                    ${isActive(item.path, item.end) 
                      ? 'bg-white/5 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                      : 'text-[#9CA3AF] hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${isActive(item.path, item.end) ? 'text-[#D4AF37]' : 'opacity-70'}`} />
                    {item.label}
                  </div>
                  {isActive(item.path, item.end) && <ChevronRight className="w-3 h-3 opacity-50" />}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* AI Intelligence Section */}
          <div>
            <h4 className="flex items-center gap-2 text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] mb-4 px-4">
              <Sparkles size={10} /> Intelligence
            </h4>
            <nav className="space-y-1">
              {SIDEBAR_AI.map((item) => (
                <NavLink
                  key={item.label} to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 text-[12px] font-medium tracking-wide
                    ${isActive(item.path) 
                      ? 'bg-[rgba(212,175,55,0.1)] text-[#D4AF37] border border-[#D4AF37]/30 shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                      : 'text-[#D4AF37]/80 hover:text-[#D4AF37] hover:bg-[rgba(212,175,55,0.05)] border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Operations Section */}
          <div>
            <h4 className="text-[9px] font-bold text-[#6B7280] uppercase tracking-[0.2em] mb-4 px-4">Operations</h4>
            <nav className="space-y-1">
              {SIDEBAR_STORE.map((item) => (
                <NavLink
                  key={item.label} to={item.path}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 text-[12px] font-medium tracking-wide
                    ${isActive(item.path) 
                      ? 'bg-white/5 text-[#D4AF37] border border-[#D4AF37]/20 shadow-[0_0_15px_rgba(212,175,55,0.05)]' 
                      : 'text-[#9CA3AF] hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-4 h-4 ${isActive(item.path) ? 'text-[#D4AF37]' : 'opacity-70'}`} />
                    {item.label}
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom Profile Area */}
        <div className="p-4 mt-auto relative z-10 border-t border-white/5 bg-[#0B0B0B]">
          {/* User Card */}
          <div className="bg-[#111] rounded-xl p-3 border border-white/5 flex items-center justify-between cursor-pointer hover:border-[#D4AF37]/30 transition-colors mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/10 bg-gradient-to-br from-[#D4AF37] to-[#B38945] flex items-center justify-center">
                <span className="text-black text-xs font-bold">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-white">{user?.name || 'Executive'}</span>
                <span className="text-[10px] text-[#9CA3AF]">Super Admin</span>
              </div>
            </div>
          </div>

          <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-widest uppercase text-red-500 hover:text-red-400 hover:bg-red-500/10 w-full px-2 py-3 rounded-lg transition-colors mt-2 border border-transparent hover:border-red-500/20">
            <LogOut className="w-3 h-3" />
            <span>Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#050505]">
        <main className="flex-1 overflow-y-auto lux-scroll relative">
          <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 0%, rgba(212,175,55,0.03) 0%, transparent 50%)' }} />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
