import React from 'react';

const BrandLogo = ({ className = "w-10 h-10", showText = false, textClassName = "text-2xl" }) => {
  return (
    <div className={`flex items-center justify-center ${showText ? 'gap-3' : ''}`}>
      <img 
        src="/logo-nexora.png" 
        alt="NexORA Emblem" 
        className={`${className} object-contain`}
        style={{ filter: 'drop-shadow(0 2px 8px rgba(212,175,55,0.2))' }}
      />
      {showText && (
        <span className={`font-serif tracking-[0.25em] ${textClassName} text-transparent bg-clip-text bg-gradient-to-br from-[#CCA969] via-[#EAD29A] to-[#B38945]`}>
          NEXORA
        </span>
      )}
    </div>
  );
};

export default BrandLogo;
