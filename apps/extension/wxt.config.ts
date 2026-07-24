import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: '../../dist',
  manifestVersion: 3,
  modules: ['@wxt-dev/module-svelte'],
  manifest: ({ browser }) => ({
    name: 'ZeroOmega Nex',
    description: 'A compile-first, cross-browser proxy profile manager.',
    version: '0.0.1',
    permissions: [],
    action: {
      default_title: 'ZeroOmega Nex',
    },
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'zeroomega-nex@chrix-goh.github',
              data_collection_permissions: {
                required: ['none'],
              },
            },
          },
        }
      : {}),
  }),
});
