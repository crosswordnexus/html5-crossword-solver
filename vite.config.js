import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

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
    // Set to `false` for readable output in js/crosswords.js
    minify: true,
  },
  plugins: [
    {
      name: 'update-sw-cache-version',
      closeBundle() {
        const swPath = resolve(__dirname, 'sw.js');
        if (fs.existsSync(swPath)) {
          let content = fs.readFileSync(swPath, 'utf-8');

          // Generate a version based on the current timestamp (YYYYMMDDHHMMSS)
          const timestamp = new Date().toISOString()
            .replace(/[-:.T]/g, '') // Remove symbols
            .slice(0, 14);          // Get up to seconds

          const newCacheName = `const CACHE_NAME = "xw-solver-v${timestamp}";`;

          // Replace the CACHE_NAME line in sw.js
          content = content.replace(/const CACHE_NAME = "[^"]+";/, newCacheName);
          fs.writeFileSync(swPath, content, 'utf-8');
          console.log(`\n[Vite Plugin] Automatically updated Service Worker cache to: xw-solver-v${timestamp}`);
        }
      }
    }
  ]
});
