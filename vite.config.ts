import { defineConfig } from 'vite';

// PUBLIC_SAFE is on unless PUBLIC_SAFE=0: development metadata (paths, hashes) is then left out of the bundle.
export default defineConfig({
  base: './',
  define: { __PUBLIC_SAFE__: JSON.stringify(process.env.PUBLIC_SAFE !== '0') },
  build: { target: 'es2020', chunkSizeWarningLimit: 900 }
});
