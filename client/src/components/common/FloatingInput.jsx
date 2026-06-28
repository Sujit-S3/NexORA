import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const FloatingInput = ({ label, type = "text", id, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="relative group w-full mb-6">
      <input
        type={inputType}
        id={id}
        className={`w-full bg-white/40 dark:bg-black/20 border ${isFocused ? 'border-[#D4AF37] dark:border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 pt-6 pb-2 ${isPassword ? 'pr-12' : ''} text-gray-900 dark:text-white backdrop-blur-md outline-none transition-all duration-300 peer placeholder-transparent`}
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
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

export default FloatingInput;
