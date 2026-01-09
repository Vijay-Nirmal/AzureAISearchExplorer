import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        // Monaco (@monaco-editor/react) can push the main bundle over the default 500kB warning threshold.
        chunkSizeWarningLimit: 1200
    }
});
