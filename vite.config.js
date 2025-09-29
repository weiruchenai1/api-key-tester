import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Use different base paths for different deployment platforms
  base: process.env.DOCKER_BUILD === 'true'
    ? '/'
    : (process.env.CF_PAGES || process.env.CF_PAGES_URL) 
      ? '/' // Cloudflare Pages uses root path
      : (mode === 'production' ? '/api-key-tester/' : '/'), // GitHub Pages uses subpath
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      PUBLIC_URL: JSON.stringify(process.env.PUBLIC_URL || '')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js'
  }
}))