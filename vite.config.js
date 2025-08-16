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
    host: 'localhost', // Changé de true à 'localhost' pour éviter les problèmes de proxy
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        timeout: 30000, // Augmenté le timeout
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
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
