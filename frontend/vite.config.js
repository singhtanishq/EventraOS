import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@components': path.resolve(__dirname, './src/components'),
            '@features': path.resolve(__dirname, './src/features'),
            '@hooks': path.resolve(__dirname, './src/hooks'),
            '@lib': path.resolve(__dirname, './src/lib'),
            '@services': path.resolve(__dirname, './src/services'),
            '@types': path.resolve(__dirname, './src/types'),
            '@layouts': path.resolve(__dirname, './src/layouts'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@store': path.resolve(__dirname, './src/store'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
            },
            mangle: {
                safari10: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    query: ['@tanstack/react-query'],
                    forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
                    ui: ['lucide-react', 'framer-motion', '@headlessui/react'],
                    utils: ['date-fns', 'clsx', 'tailwind-merge'],
                    icons: ['lucide-react'],
                    charts: ['recharts'],
                    pdf: ['jspdf', 'html2canvas'],
                },
                chunkFileNames: 'assets/js/[name]-[hash].js',
                entryFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: function (assetInfo) {
                    var info = assetInfo.name.split('.');
                    var ext = info[info.length - 1];
                    if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
                        return "assets/images/[name]-[hash].".concat(ext);
                    }
                    if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
                        return "assets/fonts/[name]-[hash].".concat(ext);
                    }
                    return "assets/[name]-[hash].".concat(ext);
                },
            },
        },
        cssCodeSplit: true,
        cssMinify: true,
        modulePreload: {
            polyfill: false,
        },
        reportCompressedSize: true,
        chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
        include: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
            'react-hook-form',
            '@hookform/resolvers/zod',
            'zod',
            'lucide-react',
            'framer-motion',
            '@headlessui/react',
            'date-fns',
            'clsx',
            'tailwind-merge',
            'axios',
            'zustand',
            'react-hot-toast',
            'react-day-picker',
            'react-select',
            'swiper',
            'react-calendar',
        ],
    },
    esbuild: {
        drop: ['console', 'debugger'],
        legalComments: 'none',
    },
});
