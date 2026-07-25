import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  plugins: [svelte()],
  test: {
    environment: 'node',
    include: ['src/**/*.component.spec.ts'],
  },
});
