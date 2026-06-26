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
        manualChunks: {
          // Core React bundle
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // HTTP client
          axios: ['axios'],
          // Heavy animation library \u2014 deferred chunk
          framer: ['framer-motion'],
          // Charts \u2014 admin only, deferred chunk
          recharts: ['recharts'],
          // 3D rendering \u2014 heavy, isolate
          three: ['three'],
          // Analytics
          posthog: ['posthog-js'],
          // Confetti
          confetti: ['react-confetti'],
          // Lucide icons \u2014 large icon set
          icons: ['lucide-react'],
        },
      },
    },
  },
});
