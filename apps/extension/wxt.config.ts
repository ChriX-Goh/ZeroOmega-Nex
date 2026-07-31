import { defineConfig } from 'wxt';

const icons = {
  16: 'icon/16.png',
  32: 'icon/32.png',
  48: 'icon/48.png',
  128: 'icon/128.png',
} as const;

const originalActionIcons = {
  16: 'icon/original-action-16.png',
  19: 'icon/original-action-19.png',
  24: 'icon/original-action-24.png',
  32: 'icon/original-action-32.png',
} as const;

const diagnosticsE2e = process.env.ZEROOMEGA_RULE_SOURCE_E2E === '1';
const ruleSourceE2eHostPermissions = diagnosticsE2e ? ['http://*/*', 'https://*/*'] : [];

export default defineConfig({
  srcDir: 'src',
  outDir: '../../dist',
  manifestVersion: 3,
  modules: ['@wxt-dev/module-svelte'],
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      if (!manifest.action) {
        throw new Error('WXT generated manifest is missing the Action entry');
      }
      manifest.action.default_title = '__MSG_manifest_icon_default_title__';
      manifest.action.default_icon = originalActionIcons;
      manifest.action.default_popup =
        wxt.config.browser === 'firefox' ? 'popup/index.html' : 'popup-iframe.html';
    },
  },
  manifest: ({ browser }) => ({
    name: '__MSG_extensionName__',
    description: '__MSG_extensionDescription__',
    default_locale: 'en',
    version: '0.0.1',
    icons,
    permissions: [
      'proxy',
      'storage',
      'alarms',
      'activeTab',
      'contextMenus',
      'tabs',
      ...(diagnosticsE2e ? ['webRequest'] : []),
    ],
    optional_permissions:
      browser === 'firefox'
        ? diagnosticsE2e
          ? ['webRequestBlocking']
          : ['webRequest', 'webRequestBlocking']
        : diagnosticsE2e
          ? ['webRequestAuthProvider']
          : ['webRequest', 'webRequestAuthProvider'],
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    ...(ruleSourceE2eHostPermissions.length === 0
      ? {}
      : { host_permissions: ruleSourceE2eHostPermissions }),
    action: {
      default_title: '__MSG_manifest_icon_default_title__',
      default_icon: originalActionIcons,
      default_popup: browser === 'firefox' ? 'popup/index.html' : 'popup-iframe.html',
    },
    commands: {
      _execute_browser_action: {
        suggested_key: {
          default: 'Alt+Shift+O',
        },
        description: 'Toggle the proxy setting',
      },
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
