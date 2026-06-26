import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center p-1 rounded-full bg-black/5 dark:bg-white/5 
backdrop-blur-xl border border-black/10 dark:border-white/10 shadow-sm w-14 h-7 group overflow-hidden 
transition-transform duration-500 hover:scale-105 active:scale-95"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/30 to-transparent 
translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      <div className="relative w-full h-full flex items-center justify-between px-1">
        <Sun className={`w-3 h-3 transition-colors ${isDark ? 'text-gray-500' : 'text-[#D4AF37]'}`} />
        <Moon className={`w-3 h-3 transition-colors ${isDark ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
        <motion.div 
          initial={false}
          animate={{ x: isDark ? 28 : 0 }}
          className="absolute left-0 w-5 h-5 bg-white dark:bg-[#0B1220] rounded-full shadow-sm flex items-center 
justify-center border border-gray-200 dark:border-white/10"
        >
          {isDark ? <Moon className="w-2.5 h-2.5 text-[#D4AF37]" /> : <Sun className="w-2.5 h-2.5 text-[#D4AF37]" />}
        </motion.div>
      </div>
    </button>
  );
};

export default ThemeToggle;
