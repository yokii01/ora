
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { createApiProxyPlugin } from './server/api/proxy.js'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command, mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    base: command === 'build' ? '/ora/' : '/',
    logLevel: 'error',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
            ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-tooltip', 'framer-motion'],
            map: ['leaflet', 'react-leaflet']
          }
        }
      }
    },
    plugins: [
      react(),
      createApiProxyPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
          globIgnores: ['**/Banner/**'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'ORAs Application',
          short_name: 'ORAs',
          description: 'A premium platform by Yokii',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ]
  };
});
