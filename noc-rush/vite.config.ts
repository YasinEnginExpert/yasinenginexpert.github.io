import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: '/noc-rush/', // Deploying to subdirectory of main site
    build: {
        rollupOptions: {
            input: path.resolve(__dirname, 'index.dev.html')
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,
        open: '/index.dev.html'
    }
})
