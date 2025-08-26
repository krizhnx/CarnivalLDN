import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // Enable gzip compression for build output
    rollupOptions: {
      output: {
        // Ensure assets are optimized for compression
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['framer-motion', 'lucide-react'],
          forms: ['react-hook-form'],
          stripe: ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    // Enable source maps for debugging (optional)
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    host: true, // Allow external connections
    open: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.1.103',
      'fd99fd42da24.ngrok-free.app',
      '.ngrok-free.app', // Allow all ngrok subdomains
      '.ngrok.io' // Allow all ngrok.io subdomains
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
