import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'motion';
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'redux';
            if (id.includes('react-hook-form') || id.includes('yup') || id.includes('@hookform')) return 'forms';
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
