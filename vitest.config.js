import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/__tests__/setup.js'],
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
