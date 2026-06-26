/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#D4AF37', // Replaced purple with Luxury Gold
          600: '#B38945',
          700: '#916728',
          800: '#734E17',
          900: '#54380D',
          950: '#3A2605',
        },
        surface: {
          dark: '#05070A',         // New dark background spec
          'dark-card': '#0B1220',  // New dark surface spec
          'dark-border': '#1F2937',// Subtle border
          'glass': 'rgba(11, 18, 32, 0.65)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'luxury-gradient': 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(5, 7, 10, 0) 100%)',
        'glow-conic': 'conic-gradient(from 180deg at 50% 50%, rgba(212, 175, 55, 0.5) 0deg, rgba(212, 175, 55, 0.1) 180deg, rgba(212, 175, 55, 0.8) 360deg)',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(212, 175, 55, 0.15)',
        'glow-strong': '0 0 40px rgba(212, 175, 55, 0.3)',
        'glass': 'inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'xs': '2px',
        'xl': '24px',
        '2xl': '40px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
