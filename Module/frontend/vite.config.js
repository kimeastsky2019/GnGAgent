import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/demand': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/demand/, '/api')
      },
      '/api/supply': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/supply/, '/api')
      },
      '/api/matching': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/matching/, '/api/matching')
      },
      '/api/scenarios': {
        target: 'http://localhost:5004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/scenarios/, '/api/scenarios')
      }
    }
  }
})

