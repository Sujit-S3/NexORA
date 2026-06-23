// NexORA — Footer Component

import { Link } from 'react-router-dom';
import { APP_NAME } from '@utils/constants';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-300 mt-auto">
      <div className="container-app py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 no-underline">
              <span className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white text-sm font-black">N</span>
              <span className="font-display font-bold text-xl text-white">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your premium destination for shopping. Quality products, unbeatable prices.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors no-underline">All Products</Link></li>
              <li><Link to="/products?featured=true" className="hover:text-white transition-colors no-underline">Featured</Link></li>
              <li><Link to="/products?sort=sold:desc" className="hover:text-white transition-colors no-underline">Best Sellers</Link></li>
              <li><Link to="/products?sort=createdAt:desc" className="hover:text-white transition-colors no-underline">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Account</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors no-underline">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors no-underline">Create Account</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors no-underline">My Orders</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors no-underline">Profile</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400">Free shipping above ₹499</span></li>
              <li><span className="text-gray-400">Easy 30-day returns</span></li>
              <li><span className="text-gray-400">Secure payments</span></li>
              <li><span className="text-gray-400">24/7 customer support</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700/50 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {year} {APP_NAME}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Built with ❤️ on MERN</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
