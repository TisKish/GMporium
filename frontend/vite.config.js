import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api/* to the Spring Boot backend so the React app can use
    // relative fetch paths with no CORS configuration needed.
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
