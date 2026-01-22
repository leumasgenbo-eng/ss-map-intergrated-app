import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@google/genai']
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@google/genai': path.resolve(__dirname, 'node_modules', '@google', 'genai', 'dist', 'web', 'index.mjs')
    }
  },
  server: {
    fs: {
      allow: [
        path.resolve(__dirname, '..'),
        path.resolve(__dirname, '..', 'SMAP-HUGE-PROJECT-3-main'),
        path.resolve(__dirname, '..', 'Copy-of-SSMapMOCKExamination-ANALYTICS---22suc-main'),
        path.resolve(__dirname, '..', 'ExercisesAssessmentandReportingsimpler-2-main')
      ]
    },
    // Bind to localhost so the Vite client uses localhost for HMR
    host: '127.0.0.1',
    port: 5175,
    hmr: {
      host: '127.0.0.1'
    }
  }
})

