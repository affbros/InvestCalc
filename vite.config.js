import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
  },
  server: {
    port: 3000,
    open: true
  },
  // Ensure JSX files are processed correctly
  esbuild: {
    jsxInject: `import React from 'react'`
  },
  // Explicitly set base path for deployment
  base: '/',
})