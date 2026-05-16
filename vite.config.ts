import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: true,
  plugins: [react(), tsconfigPaths()],
  build: {
    minify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-bootstrap', 'bootstrap'],
          'vendor-utils': ['zod', '@supabase/supabase-js', 'lucide-react']
        }
      }
    }
  },
  server: {
    port: 3000,
    hmr: {
      overlay: true,
    },
  },
});
