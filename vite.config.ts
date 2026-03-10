import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: true,
  plugins: [react(), tsconfigPaths()],
  build: {
    minify: false,
  },
  server: {
    port: 3000,
    hmr: {
      overlay: true,
    },
  },
});
