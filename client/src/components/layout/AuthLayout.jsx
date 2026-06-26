import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTheme } from '@context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// Apple VisionOS style Theme Toggle for Auth Pages
const AuthThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="absolute top-6 right-6 z-50 flex items-center justify-center p-1 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-lg w-16 h-8 group overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      <div className="relative w-full h-full flex items-center justify-between px-1.5">
        <Sun className={`w-3.5 h-3.5 transition-colors ${isDark ? 'text-gray-500' : 'text-yellow-500'}`} />
        <Moon className={`w-3.5 h-3.5 transition-colors ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
        <motion.div 
          initial={false}
          animate={{ x: isDark ? 32 : 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute left-0 w-6 h-6 bg-white dark:bg-[#1A1A1A] rounded-full shadow-sm flex items-center justify-center border border-gray-200 dark:border-white/10"
        >
          {isDark ? <Moon className="w-3 h-3 text-blue-400" /> : <Sun className="w-3 h-3 text-yellow-500" />}
        </motion.div>
      </div>
    </button>
  );
};

const AuthLayout = ({ children }) => {
  const { isDark } = useTheme();
  
  // Parallax tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 50, stiffness: 400 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth) * 2 - 1;
    const y = (clientY / innerHeight) * 2 - 1;
    mouseX.set(x);
    mouseY.set(y);
  };

  // Layer Transforms
  const l1x = useTransform(smoothX, [-1, 1], [-15, 15]);
  const l1y = useTransform(smoothY, [-1, 1], [-15, 15]);
  
  const l2x = useTransform(smoothX, [-1, 1], [30, -30]);
  const l2y = useTransform(smoothY, [-1, 1], [30, -30]);

  const l3x = useTransform(smoothX, [-1, 1], [-50, 50]);
  const l3y = useTransform(smoothY, [-1, 1], [-50, 50]);

  return (
    <div 
      className="min-h-screen w-full flex flex-col lg:flex-row overflow-hidden transition-colors duration-700"
      onMouseMove={handleMouseMove}
    >
      <AuthThemeToggle />

      {/* LEFT SIDE: Parallax Showcase */}
      <div className="relative w-full lg:w-1/2 min-h-[40vh] lg:min-h-screen overflow-hidden flex items-center justify-center order-2 lg:order-1">
        
        {/* Layer 1: Ambient Blobs */}
        <motion.div style={{ x: l1x, y: l1y }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#D4AF37]/20 dark:bg-[#D4AF37]/15 rounded-full blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-900/20 rounded-full blur-[120px]" />
        </motion.div>

        {/* Layer 2: Floating Products */}
        <motion.div style={{ x: l2x, y: l2y }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="absolute ml-10 mt-10 w-[400px] h-[400px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-90 transition-opacity duration-1000">
             <img src="/assets/luxury/watches/omega_speedmaster.png" alt="Luxury Watch" className="w-full h-full object-cover rounded-full blur-[1px] opacity-70" />
          </div>
          <div className="absolute -top-20 -left-10 w-[300px] h-[300px] rounded-[3rem] mix-blend-multiply dark:mix-blend-screen opacity-60 rotate-12 scale-75 transition-opacity duration-1000">
             <img src="/assets/luxury/electronics/sony_xm6.png" alt="Headphones" className="w-full h-full object-cover rounded-[3rem]" />
          </div>
        </motion.div>

        {/* Layer 3: Glass Badges */}
        <motion.div style={{ x: l3x, y: l3y }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 hidden md:flex">
          <div className="absolute top-1/3 right-1/4 bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/50 dark:border-white/20 p-4 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B38945] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Authenticity</p>
              <p className="text-sm text-gray-900 dark:text-white font-bold">100% Guaranteed</p>
            </div>
          </div>
          
          <div className="absolute bottom-1/4 left-1/4 bg-white/40 dark:bg-white/10 backdrop-blur-xl border border-white/50 dark:border-white/20 p-4 rounded-2xl shadow-xl">
             <p className="text-2xl font-serif text-[#D4AF37] font-bold">NEXORA</p>
             <p className="text-[10px] tracking-widest text-gray-600 dark:text-gray-300 uppercase">Curated Collection</p>
          </div>
        </motion.div>

      </div>

      {/* RIGHT SIDE: Auth Card */}
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-6 md:p-12 z-30 order-1 lg:order-2">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>

    </div>
  );
};

export default AuthLayout;
