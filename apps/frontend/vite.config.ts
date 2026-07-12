import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Use esbuild (default, fastest) for minification
    minify: 'esbuild',
    // Target modern browsers for smaller output
    target: 'es2020',
    // Raise warning limit — chunks are already split
    chunkSizeWarningLimit: 600,
    // Generate source maps for production error tracking
    sourcemap: false,
    // Report gzip sizes in build output
    reportCompressedSize: true,

    rollupOptions: {
      output: {
        // Stable chunk filenames based on content hash
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',

        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          // Icon library — large, rarely changes
          if (id.includes('lucide-react')) return 'vendor-lucide';

          // Animation library
          if (id.includes('framer-motion')) return 'vendor-motion';

          // Supabase auth client
          if (id.includes('@supabase')) return 'vendor-supabase';

          // React + router + DOM
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('react-router-dom') ||
            id.includes('scheduler')
          ) return 'vendor-react-core';

          // TanStack Query
          if (id.includes('@tanstack')) return 'vendor-query';

          // Zustand state management
          if (id.includes('zustand')) return 'vendor-zustand';

          // Everything else
          return 'vendor-libs';
        },
      },
    },
  },
});
