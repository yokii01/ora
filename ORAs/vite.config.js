
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { createApiProxyPlugin } from './server/api/proxy.js'
// Removed Base44 vite plugin for local mock setup

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    base: command === 'build' ? '/ora/' : '/',
    logLevel: 'error', // Suppress warnings, only show errors
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [
      // base44 plugin removed
      react(),
      createApiProxyPlugin(),
    ]
  };
});
