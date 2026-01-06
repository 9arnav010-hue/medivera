import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allows access from other devices / Render
    port: 5173,

    allowedHosts: ['medivera.onrender.com'], // ✅ FIX

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    },

    hmr: {
      clientPort: 5173,
    }
  }
})
