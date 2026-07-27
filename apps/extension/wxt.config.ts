import { defineConfig } from 'wxt';

const icons = {
  16: 'icon/16.png',
  32: 'icon/32.png',
  48: 'icon/48.png',
  128: 'icon/128.png',
} as const;

const ruleSourceE2eHostPermissions =
  process.env.ZEROOMEGA_RULE_SOURCE_E2E === '1' ? ['http://127.0.0.1/*'] : [];

export default defineConfig({
  srcDir: 'src',
  outDir: '../../dist',
  manifestVersion: 3,
  modules: ['@wxt-dev/module-svelte'],
  manifest: ({ browser }) => ({
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    default_locale: 'en',
    version: '0.0.1',
    icons,
    permissions: ['proxy', 'storage', 'alarms'],
    optional_permissions:
      browser === 'firefox'
        ? ['webRequest', 'webRequestBlocking']
        : ['webRequest', 'webRequestAuthProvider'],
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    ...(ruleSourceE2eHostPermissions.length === 0
      ? {}
      : { host_permissions: ruleSourceE2eHostPermissions }),
    action: {
      default_title: '__MSG_actionTitle__',
      default_icon: icons,
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
