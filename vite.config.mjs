import { defineConfig } from 'vite';

export default defineConfig({
  base: '/BookGarden/',
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        library: './library.html',
      },
    },
  },
});
