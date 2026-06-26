import React, { useState } from 'react';
import { motion } from 'framer-motion';

const FloatingInput = ({ label, type = "text", id, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group w-full mb-6">
      <input
        type={type}
        id={id}
        className={`w-full bg-white/40 dark:bg-black/20 border ${isFocused ? 'border-[#D4AF37] dark:border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 pt-6 pb-2 text-gray-900 dark:text-white backdrop-blur-md outline-none transition-all duration-300 peer placeholder-transparent`}
        placeholder={label}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => setIsFocused(false)}
        {...props}
      />
      <label 
        htmlFor={id} 
        className="absolute left-4 top-1.5 text-xs text-gray-500 dark:text-gray-400 transition-all duration-300 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#D4AF37]"
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingInput;
