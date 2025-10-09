import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/css/AccessSystem.css',
                'resources/css/ContactSupport.css',
                'resources/css/dashboard.css',
                'resources/css/index.css',
                'resources/js/app.js',
                'resources/js/dashboard.js'
            ],
            refresh: true,
        }),
        tailwindcss(),
    ],
});
