import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Dica: Adicionei sitemap.xml e robots.txt aqui para o PWA saber que eles existem
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'sitemap.xml', 'robots.txt'], 
      manifest: {
        name: 'Lumie Finance',
        short_name: 'Lumie',
        description: 'O app financeiro do Profissional Híbrido.',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            
            // 1. ISOLAR APENAS O QUE NÃO É ESSENCIAL (Gráficos, PDF, Excel)
            // Isso já reduz muito o peso inicial.
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts';
            }
            if (id.includes('xlsx') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'heavy-libs';
            }

            // 2. TUDO O RESTO VAI PARA "VENDOR"
            // Colocamos Supabase, React, UI e Utils juntos.
            // Isso garante que a ordem de inicialização seja respeitada e elimina o erro.
            return 'vendor';
          }
        },
      },
    },
  },
})
