import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {

    return {
        plugins: [sveltekit(), tailwindcss()],
        server: {
            fs: {
                allow: [
                    'static'
                ]
            }
        }
    };
});
