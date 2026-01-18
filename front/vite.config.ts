import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react()],
        resolve: {
            alias: {
                'shared-redux': path.resolve(__dirname, 'src/shared/src'),
            },
            dedupe: ['react', 'react-dom'],
        },
        server: {
            allowedHosts: ['front.mambokara.dev'],
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:8080',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, ''),
                },
            },
        },
        build: {
            rollupOptions: {
                output: {
                    manualChunks: {
                        'react-vendor': ['react', 'react-dom'],
                        'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
                        'reactflow-vendor': ['reactflow'],
                    },
                },
            },
            chunkSizeWarningLimit: 500,
        },
    }
})
