import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-svelte'],
  manifest: {
    name: 'ZeroOmega Nex',
    description: 'A compile-first, cross-browser proxy profile manager.',
    version: '0.0.1',
    permissions: [],
    action: {
      default_title: 'ZeroOmega Nex',
    },
  },
});
