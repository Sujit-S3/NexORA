import React from 'react';
import { useTheme } from '@context/ThemeContext';

const MainLogo = ({ className = "w-12 h-12", showText = false, textClassName = "text-2xl", layout = "vertical", forceDarkMode = false }) => {
  const { isDark: themeIsDark } = useTheme();
  const isDark = forceDarkMode ? true : themeIsDark;

  return (
    <div className={`flex ${layout === 'horizontal' ? 'flex-row items-center gap-4' : 'flex-col items-center justify-center'}`}>
      <img 
        src="/logo-nexora.png" 
        alt="NexORA Emblem" 
        className={`${className} object-contain`} 
        style={{ 
          filter: isDark 
            ? 'drop-shadow(0 2px 12px rgba(212,175,55,0.25))' 
            : 'drop-shadow(0 4px 12px rgba(212,175,55,0.3)) brightness(0.95) contrast(1.2)' 
        }}
      />

      {showText && (
        <div className={`flex flex-col ${layout === 'horizontal' ? 'items-start' : 'items-center'} gap-1 ${layout === 'vertical' ? 'mt-3' : ''}`}>
          <span 
            className={`font-serif tracking-[0.25em] ${textClassName} text-transparent bg-clip-text ${
              isDark 
                ? 'bg-gradient-to-br from-[#CCA969] via-[#EAD29A] to-[#B38945]'
                : 'bg-gradient-to-br from-[#B38945] via-[#D4AF37] to-[#8C6222]'
            }`}
            style={{ marginLeft: layout === 'vertical' ? '0.25em' : '0' }}
          >
            NEXORA
          </span>
          <div className="flex items-center gap-2 opacity-90">
            {layout === 'vertical' && <div className={`w-8 h-[1px] bg-gradient-to-r from-transparent ${isDark ? 'to-[#CCA969]' : 'to-[#B38945]'}`}></div>}
            <span className={`text-[9px] tracking-[0.2em] uppercase font-bold ${isDark ? 'text-[#CCA969]' : 'text-[#8C6222]'}`}>
              Curated for you
            </span>
            {layout === 'vertical' && <div className={`w-8 h-[1px] bg-gradient-to-l from-transparent ${isDark ? 'to-[#CCA969]' : 'to-[#B38945]'}`}></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainLogo;

