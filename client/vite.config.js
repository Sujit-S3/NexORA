import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path aliases — import from '@/' instead of '../../'
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@context': resolve(__dirname, './src/context'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@assets': resolve(__dirname, './src/assets'),
    },
  },

  // Development server
  server: {
    port: 5173,
    strictPort: true,
    // Proxy API calls to backend — avoids CORS issues in dev
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Build optimization
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('axios')) return 'axios';
            if (id.includes('framer-motion')) return 'framer';
            if (id.includes('recharts')) return 'recharts';
            if (id.includes('three')) return 'three';
            if (id.includes('posthog-js')) return 'posthog';
            if (id.includes('react-confetti')) return 'confetti';
            if (id.includes('lucide-react')) return 'icons';
          }
        }
      },
    },
  },
});
