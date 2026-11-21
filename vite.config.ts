import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // the three.js shell is one deliberately lazy chunk (~1.8 MB min, ~480 KB gz),
    // loaded behind the home page; the entry chunk is ~75 KB gz
    chunkSizeWarningLimit: 2000,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
} as never)
