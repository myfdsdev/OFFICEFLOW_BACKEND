import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
 import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  logLevel: 'error',
  plugins: [
    react(),
   VitePWA({ 
     manifest: {
      name: 'AttendEase',
       short_name: 'AttendEase',
       start_url: '.',
       display: 'standalone',
       background_color: '#ffffff',
       theme_color: '#3B82F6',
       icons: [
        // Add your app icons here if needed
       ]
     }
   })
  ]
});