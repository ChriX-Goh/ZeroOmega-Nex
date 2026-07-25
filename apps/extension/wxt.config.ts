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
    permissions: ['proxy', 'storage'],
    optional_permissions:
      browser === 'firefox'
        ? ['webRequest', 'webRequestBlocking']
        : ['webRequest', 'webRequestAuthProvider'],
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    action: {
      default_title: 'ZeroOmega Nex',
    },
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'zeroomega-nex@chrix-goh.github',
              strict_min_version: '91.1.0',
              data_collection_permissions: {
                required: ['none'],
              },
            },
          },
        }
      : {}),
  }),
});
