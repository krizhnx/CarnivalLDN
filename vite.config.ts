import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
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
