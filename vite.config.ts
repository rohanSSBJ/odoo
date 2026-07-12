import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Dev only: forward API calls to the deployed backend.
      // In production Nginx serves the build and proxies /api same-origin.
      '/api': {
        target: 'http://3.110.169.152',
        changeOrigin: true,
      },
    },
  },
})
