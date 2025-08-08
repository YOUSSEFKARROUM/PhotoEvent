import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true, // Permet l'accès depuis d'autres appareils
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Changé de 3000 à 3001
        changeOrigin: true,
        secure: false,
        timeout: 5000, // Timeout pour éviter les blocages
      },
    },
    // Optimisations pour le démarrage rapide
    hmr: {
      overlay: false, // Désactive l'overlay d'erreur pour plus de rapidité
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          utils: ['axios', 'lucide-react']
        }
      }
    }
  },
  define: {
    global: 'globalThis',
  },
  // Optimisations pour le développement
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'lucide-react', 'framer-motion'],
    exclude: ['@vitejs/plugin-react']
  },
  // Cache pour accélérer les rebuilds
  cacheDir: '.vite',
  // Optimisations supplémentaires pour le développement
  esbuild: {
    target: 'esnext',
    supported: {
      'top-level-await': true
    }
  }
});
