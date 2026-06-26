import React from 'react';

export default function LuxuryBackground({ children, isDark }) {
  // Extracting the exact background logic from Home.jsx
  // Home uses 'transparent' in Light Mode to inherit the global body background from index.css
  // and '#050505' in Dark Mode.
  const BG = isDark ? '#050505' : 'transparent';
  
  return (
    <div className="w-full min-h-screen transition-colors duration-500" style={{ background: BG }}>
      {children}
    </div>
  );
}
