import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const repositoryRoot = new URL('../', import.meta.url);
const architectureGuardedPaths = [
  'apps/extension/src',
  'apps/extension/wxt.config.ts',
  'packages/browser-adapters/src/authentication-listener.ts',
];
const uiGuardedPaths = [
  'apps/extension/src/entrypoints/options',
  'apps/extension/src/entrypoints/popup',
];
const sourceExtensions = new Set(['.ts', '.js', '.mjs', '.svelte']);
const architectureForbidden = [
  {
    expression: /proxy\.onRequest\.addListener/u,
    reason: 'global request-time proxy decisions are prohibited by the PAC-first architecture',
  },
  {
    expression: /webRequest\.(?!onAuthRequired\b)[A-Za-z]+\.addListener/u,
    reason: 'only the opt-in proxy authentication challenge listener may use WebRequest',
  },
  {
    expression: /on(?:Completed|ErrorOccurred)\??\.addListener/u,
    allowedPaths: ['apps/extension/src/lib/request-diagnostics-runtime.ts'],
    reason:
      'completion/error listeners are prohibited outside the explicit bounded request-diagnostics runtime',
  },
  {
    expression: /["']<all_urls>["']/u,
    reason: 'the extension must not request or register all-URL access',
  },
];
const uiForbidden = [
  {
    expression: /\b(?:browser|chrome)\??\.(?:proxy|storage|webRequest)\b/u,
    reason: 'Options and Popup code must not access proxy, storage, or WebRequest APIs directly',
  },
  {
    expression: /\bglobalThis\.(?:browser|chrome)\??\.(?:proxy|storage|webRequest)\b/u,
    reason: 'Options and Popup code must not reach browser APIs through globalThis',
  },
  {
    expression: /\b(?:browser|chrome)\s*\[\s*["'](?:proxy|storage|webRequest)["']\s*\]/u,
    reason: 'Options and Popup code must not use computed browser API access',
  },
  {
    expression: /\b(?:browser|chrome)\??\.runtime\.sendMessage\b/u,
    reason: 'Options and Popup code must use the typed profile-workflow client',
  },
  {
    expression: /from\s+["']@zeroomega-nex\/browser-adapters["']/u,
    reason: 'Options and Popup components must not import browser adapter implementations',
  },
  {
    expression:
      /from\s+["'][^"']*(?:browser-proxy-runtime|proxy-auth-runtime|profile-workflow-runtime)["']/u,
    reason: 'Options and Popup components must not import background runtime implementations',
  },
  {
    expression:
      /\bBrowserStorage(?:ProxyAuthentication|SnapshotActivation|ProfileWorkflow)Repository\b/u,
    reason: 'persistent repositories belong to the background control plane, not UI components',
  },
];

async function collect(pathname) {
  const absolute = new URL(pathname, repositoryRoot);
  try {
    const entries = await readdir(absolute, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const child = join(absolute.pathname, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await collect(relative(repositoryRoot.pathname, child))));
      } else if (sourceExtensions.has(extname(entry.name))) {
        files.push(child);
      }
    }
    return files;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOTDIR') {
      return [absolute.pathname];
    }
    throw error;
  }
}

async function scan(paths, rules, scope) {
  const violations = [];
  const files = new Set();
  for (const guardedPath of paths) {
    for (const file of await collect(guardedPath)) files.add(file);
  }
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const repositoryPath = relative(repositoryRoot.pathname, file);
    for (const rule of rules) {
      if (rule.expression.test(source) && !(rule.allowedPaths ?? []).includes(repositoryPath)) {
        violations.push(`${repositoryPath} [${scope}]: ${rule.reason}`);
      }
    }
  }
  return { files: files.size, violations };
}

const architecture = await scan(
  architectureGuardedPaths,
  architectureForbidden,
  'PAC-first architecture',
);
const ui = await scan(uiGuardedPaths, uiForbidden, 'UI/background boundary');
const violations = [...architecture.violations, ...ui.violations];
const diagnosticsPath = new URL(
  'apps/extension/src/lib/request-diagnostics-runtime.ts',
  repositoryRoot,
);
try {
  const diagnostics = await readFile(diagnosticsPath, 'utf8');
  const required = [
    'storage.session',
    'REQUEST_DIAGNOSTICS_ACTIVE_GLOBAL_LIMIT',
    'REQUEST_DIAGNOSTICS_ACTIVE_PER_TAB_LIMIT',
    "urls: ['http://*/*', 'https://*/*']",
    "message.action === 'start'",
    "message.action === 'stop'",
  ];
  const forbidden = [
    '<all_urls>',
    'requestHeaders',
    'requestBody',
    'responseBody',
    'cookieStoreId',
  ];
  if (!required.every((entry) => diagnostics.includes(entry))) {
    violations.push(
      'apps/extension/src/lib/request-diagnostics-runtime.ts [bounded diagnostics]: session-only activation, listener, or active-request bounds are missing',
    );
  }
  if (forbidden.some((entry) => diagnostics.includes(entry))) {
    violations.push(
      'apps/extension/src/lib/request-diagnostics-runtime.ts [bounded diagnostics]: forbidden payload or all-host capture surface detected',
    );
  }
} catch (error) {
  if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'))
    throw error;
}

if (violations.length > 0) {
  console.error('Architecture guard failed:\n' + violations.map((item) => `- ${item}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    `Architecture guard passed: ${architecture.files} architecture files and ${ui.files} UI files checked.`,
  );
}
