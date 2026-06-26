// NexORA — Luxury Footer (embedded in Home V7, this is the standalone layout footer)
import { Link } from 'react-router-dom';

const FOOTER_COL = {
  shop:    ['All Products','New Arrivals','Best Sellers','Collections','Sale'],
  care:    ['Contact Us','Shipping Info','Returns & Refunds','FAQ','Affiliate Program'],
  company: ['About NexORA','Careers','Press','Privacy Policy','Terms of Service'],
};

const Footer = () => (
  <footer className="bg-[#0B0B0B] border-t border-[#1A1A1A]">
    <div className="container-app py-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 lg:gap-12">

        {/* Col 1 – Brand */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-sm flex items-center justify-center font-playfair font-bold text-black text-lg"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #B38945)' }}>N</div>
            <span className="text-white font-playfair font-semibold text-lg tracking-wider">NEXORA</span>
          </div>
          <p className="text-[13px] leading-relaxed text-gray-500">
            Curated luxury, powered by intelligence. Discover the finest products from around the world.
          </p>
        </div>

        {/* Col 2 – Shop */}
        <div>
          <h4 className="text-white text-[11px] font-semibold tracking-widest uppercase mb-5">Shop</h4>
          <ul className="space-y-3">
            {FOOTER_COL.shop.map(l => (
              <li key={l}><Link to="/products" className="text-[13px] text-gray-500 hover:text-[#D4AF37] transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>

        {/* Col 3 – Customer Care */}
        <div>
          <h4 className="text-white text-[11px] font-semibold tracking-widest uppercase mb-5">Customer Care</h4>
          <ul className="space-y-3">
            {FOOTER_COL.care.map(l => (
              <li key={l}><Link to={l === 'Contact Us' ? '/contact' : '/'} className="text-[13px] text-gray-500 hover:text-[#D4AF37] transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>

        {/* Col 4 – Company */}
        <div>
          <h4 className="text-white text-[11px] font-semibold tracking-widest uppercase mb-5">Company</h4>
          <ul className="space-y-3">
            {FOOTER_COL.company.map(l => (
              <li key={l}><Link to={l === 'Privacy Policy' ? '/privacy-policy' : l === 'Terms of Service' ? '/terms-of-service' : '/'} className="text-[13px] text-gray-500 hover:text-[#D4AF37] transition-colors">{l}</Link></li>
            ))}
          </ul>
        </div>

        {/* Col 5 – Newsletter */}
        <div>
          <h4 className="text-white text-[11px] font-semibold tracking-widest uppercase mb-5">Newsletter</h4>
          <p className="text-[13px] mb-5 text-gray-500">Be the first to know about new arrivals and exclusive offers.</p>
          <div className="flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 text-[12px] bg-transparent outline-none text-white"
              style={{ border: '1px solid #2A2A2A', borderRight: 'none' }}
            />
            <button className="px-4 py-2.5 text-[11px] font-semibold" style={{ background: '#D4AF37', color: '#000' }}>
              →
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div className="container-app py-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[#1A1A1A]">
      <p className="text-[12px] text-gray-600">© {new Date().getFullYear()} NexORA. All rights reserved.</p>
      <div className="flex gap-6">
        {['Privacy Policy','Terms of Service'].map(l => (
          <Link key={l} to={l === 'Privacy Policy' ? '/privacy-policy' : '/terms-of-service'} className="text-[12px] text-gray-600 hover:text-[#D4AF37] transition-colors">{l}</Link>
        ))}
      </div>
    </div>
  </footer>
);

export default Footer;
