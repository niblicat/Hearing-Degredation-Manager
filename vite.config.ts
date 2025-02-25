import { defineConfig, loadEnv } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import dotenvExpand from 'dotenv-expand';

export default defineConfig(({ mode }) => {
    // This check is important!
    if (mode === 'development') {
        const env = loadEnv(mode, process.cwd(), '');
        dotenvExpand.expand({ parsed: env });
    }

    return {
        plugins: [sveltekit(), tailwindcss()]
    };
});
