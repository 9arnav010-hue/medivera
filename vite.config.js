import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Better than '0.0.0.0' for Render
    port: 5173,
    strictPort: true, // Exit if port is taken
    
    // Add CORS headers for Render
    cors: true,
    
    // Add this for Render WebSocket
    hmr: {
      host: 'medivera.onrender.com',
      clientPort: 443, // Render uses 443 for HTTPS
    }
  },
  // IMPORTANT: Add preview config for production
  preview: {
    host: true,
    port: 10000, // Render default preview port
    strictPort: true
  },
  // IMPORTANT: For production API calls
  build: {
    rollupOptions: {
      external: [], // Keep empty unless you need specific exclusions
    }
  }
})
