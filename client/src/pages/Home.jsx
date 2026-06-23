// NexORA — Home Page (stub)
// Full implementation in Phase 3.

import { Link } from 'react-router-dom';
import { APP_NAME } from '@utils/constants';

const Home = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-secondary-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary-400 rounded-full blur-3xl" />
        </div>
        <div className="container-app relative section text-center">
          <div className="inline-flex items-center gap-2 badge badge-primary mb-6 px-4 py-1.5">
            <span className="animate-pulse-slow">✨</span>
            <span>Premium Shopping Experience</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tight mb-6 text-balance">
            Discover Your
            <br />
            <span className="gradient-text">Perfect Style</span>
          </h1>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto mb-10">
            Shop thousands of curated products with fast delivery, easy returns, and the best prices guaranteed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" id="hero-shop-now-btn" className="btn-primary btn-lg shadow-glow">
              Shop Now →
            </Link>
            <Link to="/products?featured=true" className="btn btn-lg border-2 border-white/30 hover:border-white text-white hover:bg-white/10">
              Featured Items
            </Link>
          </div>
          <div className="flex items-center justify-center gap-8 mt-14 text-sm text-primary-300">
            <div className="flex items-center gap-2"><span>🚚</span><span>Free Shipping ₹499+</span></div>
            <div className="hidden sm:flex items-center gap-2"><span>🔄</span><span>30-Day Returns</span></div>
            <div className="hidden sm:flex items-center gap-2"><span>🔒</span><span>Secure Payments</span></div>
          </div>
        </div>
      </section>

      {/* Coming Soon Placeholder */}
      <section className="section container-app text-center">
        <div className="card p-12 max-w-lg mx-auto">
          <div className="text-6xl mb-4">🏗️</div>
          <h2 className="section-title mb-3">Phase 3 Coming Soon</h2>
          <p className="section-subtitle">
            Product listings, categories, and featured items will be built in Phase 3.
          </p>
          <Link to="/products" className="btn-primary mt-6 inline-flex">Browse Products</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
