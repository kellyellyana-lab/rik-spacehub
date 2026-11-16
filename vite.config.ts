import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages: assets are served under /rik-spacehub/ subpath
  base: '/rik-spacehub/',
  server: {
    port: 3000,
    open: true,
  },
});
