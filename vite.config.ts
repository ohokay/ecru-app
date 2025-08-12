import { defineConfig, mergeConfig } from 'vite'
import { tanstackViteConfig } from '@tanstack/vite-config'
import react from '@vitejs/plugin-react'

const config = defineConfig({
  // Framework plugins, vitest config, etc.
  plugins: [
    react(),
  ],
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: './src/index.ts',
    srcDir: './src',
  }),
)