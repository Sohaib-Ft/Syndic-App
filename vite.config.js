import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Trigger dev server restart after package installation
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
