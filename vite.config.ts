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
  // 👇 A MÁGICA DA OTIMIZAÇÃO COMEÇA AQUI 👇
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. ISOLAR O PESADO (Gráficos, Supabase, PDF, Excel)
            // Esses são os verdadeiros culpados pelo tamanho do bundle.
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('xlsx') || id.includes('jspdf') || id.includes('html2canvas')) {
              return 'heavy-libs';
            }

            // 2. MANTER O NÚCLEO JUNTO (React + UI + Router)
            // Colocar React, Radix, Lucide e Router no mesmo "saco" (vendor)
            // previne o erro de 'forwardRef' e garante que a UI carregue sem falhas.
            return 'vendor';
          }
        },
      },
    },
  },
})