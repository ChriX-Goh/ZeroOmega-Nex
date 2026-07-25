import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const repositoryRoot = new URL('../', import.meta.url);
const guardedPaths = [
  'apps/extension/src',
  'apps/extension/wxt.config.ts',
  'packages/browser-adapters/src/authentication-listener.ts',
];
const sourceExtensions = new Set(['.ts', '.js', '.mjs', '.svelte']);
const forbidden = [
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
    reason: 'proxy authentication must not add persistent request completion monitoring',
  },
  {
    expression: /["']<all_urls>["']/u,
    reason: 'the extension must not request or register all-URL access',
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

const violations = [];
for (const guardedPath of guardedPaths) {
  for (const file of await collect(guardedPath)) {
    const source = await readFile(file, 'utf8');
    for (const rule of forbidden) {
      if (rule.expression.test(source)) {
        violations.push(`${relative(repositoryRoot.pathname, file)}: ${rule.reason}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Architecture guard failed:\n' + violations.map((item) => `- ${item}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log('Architecture guard passed.');
}
