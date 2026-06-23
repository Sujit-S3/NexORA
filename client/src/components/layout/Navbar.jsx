// NexORA — Navbar Component

import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { useCart } from '@context/CartContext';
import { useTheme } from '@context/ThemeContext';
import { APP_NAME } from '@utils/constants';

const Navbar = () => {
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-primary-600 dark:text-primary-400'
        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-gray-200/50 dark:border-gray-700/50">
      <nav className="container-app">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-2 font-display font-bold text-xl text-gray-900 dark:text-white no-underline"
          >
            <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white text-sm font-black shadow-glow-sm">
              N
            </span>
            <span className="gradient-text">{APP_NAME}</span>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" end className={navLinkClass}>Home</NavLink>
            <NavLink to="/products" className={navLinkClass}>Products</NavLink>
            {isAdmin && (
              <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>
            )}
          </div>

          {/* ── Desktop Right Actions ── */}
          <div className="hidden md:flex items-center gap-3">

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={toggleTheme}
              className="btn-icon text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              id="cart-nav-btn"
              className="btn-icon relative text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-secondary-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="profile-menu-btn"
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="flex items-center gap-2 btn-ghost px-3 py-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 card py-1 shadow-xl animate-slide-down z-50">
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 no-underline">Profile</Link>
                    <Link to="/orders" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 no-underline">My Orders</Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setProfileOpen(false)} className="block px-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 no-underline">Admin Dashboard</Link>
                    )}
                    <div className="divider my-1" />
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">Get Started</Link>
              </div>
            )}
          </div>

          {/* ── Mobile Menu Button ── */}
          <button
            id="mobile-menu-btn"
            className="md:hidden btn-icon"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile Nav ── */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1 animate-slide-down border-t border-gray-100 dark:border-gray-700 mt-2">
            <NavLink to="/" end className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setMobileOpen(false)}>Home</NavLink>
            <NavLink to="/products" className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setMobileOpen(false)}>Products</NavLink>
            <NavLink to="/cart" className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setMobileOpen(false)}>Cart {itemCount > 0 && `(${itemCount})`}</NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/profile" className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setMobileOpen(false)}>Profile</NavLink>
                <NavLink to="/orders" className={({ isActive }) => `block px-3 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`} onClick={() => setMobileOpen(false)}>My Orders</NavLink>
                {isAdmin && <NavLink to="/admin" className="block px-3 py-2 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-400" onClick={() => setMobileOpen(false)}>Admin</NavLink>}
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2 px-3">
                <Link to="/login" className="btn btn-outline text-sm flex-1 text-center" onClick={() => setMobileOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn-primary text-sm flex-1 text-center" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </div>
            )}
            <div className="px-3 pt-2">
              <button onClick={toggleTheme} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
