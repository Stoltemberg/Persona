import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('react-router-dom')) return 'ui'
          if (id.includes('three')) return 'three'
          if (id.includes('recharts')) return 'charts'
          if (id.includes('@supabase')) return 'supabase'
          if (id.includes('framer-motion') || id.includes('animejs')) return 'motion'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('date-fns')) return 'date'
          if (id.includes('driver.js')) return 'tour'
          if (id.includes('react-helmet-async') || id.includes('react-swipeable') || id.includes('clsx') || id.includes('tailwind-merge') || id.includes('sonner')) return 'ui'

          return 'vendor'
        }
      }
    }
  },
  plugins: [
    react(),
  ],
})
