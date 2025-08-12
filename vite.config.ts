import { defineConfig, mergeConfig } from 'vite'
import { tanstackViteConfig } from '@tanstack/vite-config'
import react from '@vitejs/plugin-react'

const config = defineConfig({
  // Framework plugins, vitest config, etc.
  server: {
    allowedHosts: ['ecru-app.onrender.com', 'ecru.app', 'localhost', '127.0.0.1'],
  },
  plugins: [
    react(),
  ],
})

export default mergeConfig(
  config, 
  tanstackViteConfig({
    entry: './src/main.tsx',
    srcDir: './src',
  }),
)