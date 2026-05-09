import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  server: {
    // port: 3005,
    port: 5173, 
    host: true, // Allows access on local network (e.g. mobile devices)
  },
})