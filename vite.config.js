import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/crosswords.js'),
      name: 'CrosswordNexus',
      formats: ['iife'],
      fileName: () => 'crosswords.js',
    },
    outDir: 'js',
    emptyOutDir: false,
    // Disable minification for now if we want to debug, or enable it
    minify: false,
  },
});
