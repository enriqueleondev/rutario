import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' permite servir el build desde cualquier ruta (preview o subdominio)
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, proxy: { '/api': 'http://localhost:8080' } },
})
