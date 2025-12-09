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
    chunkSizeWarningLimit: 1600, // Aumenta o limite do aviso (para parar de reclamar)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Se o arquivo vier de node_modules (bibliotecas instaladas)
          if (id.includes('node_modules')) {
            
            // 1. Separa o Supabase (é pesado e muda pouco)
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            
            // 2. Separa a biblioteca de gráficos (Recharts é gigante)
            if (id.includes('recharts')) {
              return 'recharts';
            }

            // 3. Separa Ícones e Componentes UI (Lucide, Radix)
            if (id.includes('lucide') || id.includes('@radix-ui')) {
              return 'ui-vendor';
            }

            // 4. Separa o Core do React (Cache eterno)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }

            // 5. O resto fica num arquivo genérico "vendor"
            return 'vendor';
          }
        },
      },
    },
  },
})