import { readdir, readFile } from 'node:fs/promises';
import { basename, join, relative } from 'node:path';

const repositoryRoot = new URL('../', import.meta.url);
const outputRoot = new URL('../dist/', import.meta.url);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = join(directory.pathname, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(new URL(`file://${child}/`))));
    } else {
      files.push(child);
    }
  }
  return files;
}

const files = await walk(outputRoot);
const manifestFiles = files.filter((file) => basename(file) === 'manifest.json');

if (manifestFiles.length < 2) {
  throw new Error(`Expected Chromium and Firefox manifests, found ${manifestFiles.length}.`);
}

const forbiddenPermissions = new Set(['proxy', 'webRequest', 'webRequestBlocking', '<all_urls>']);

for (const file of manifestFiles) {
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  const permissions = [
    ...(Array.isArray(manifest.permissions) ? manifest.permissions : []),
    ...(Array.isArray(manifest.host_permissions) ? manifest.host_permissions : []),
    ...(Array.isArray(manifest.optional_permissions) ? manifest.optional_permissions : []),
    ...(Array.isArray(manifest.optional_host_permissions)
      ? manifest.optional_host_permissions
      : []),
  ];
  const violations = permissions.filter((permission) => forbiddenPermissions.has(permission));

  if (violations.length > 0) {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} contains forbidden Milestone 1 permissions: ${violations.join(', ')}`,
    );
  }
  if (!manifest.action?.default_popup) {
    throw new Error(`${relative(repositoryRoot.pathname, file)} is missing the popup entrypoint.`);
  }
  if (!manifest.options_ui?.page) {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} is missing the options entrypoint.`,
    );
  }

  console.log(
    `${relative(repositoryRoot.pathname, file)} passed: MV${manifest.manifest_version}, no proxy or all-URL permissions.`,
  );
}
