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

const forbiddenPermissions = new Set(['webRequest', 'webRequestBlocking', '<all_urls>']);
const requiredPermissions = ['proxy', 'storage'];

for (const file of manifestFiles) {
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
  const hostPermissions = [
    ...(Array.isArray(manifest.host_permissions) ? manifest.host_permissions : []),
    ...(Array.isArray(manifest.optional_host_permissions)
      ? manifest.optional_host_permissions
      : []),
  ];
  const optionalPermissions = Array.isArray(manifest.optional_permissions)
    ? manifest.optional_permissions
    : [];
  const allPermissions = [...permissions, ...optionalPermissions, ...hostPermissions];
  const violations = allPermissions.filter((permission) => forbiddenPermissions.has(permission));

  if (violations.length > 0) {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} contains forbidden permissions: ${violations.join(', ')}`,
    );
  }
  for (const permission of requiredPermissions) {
    if (!permissions.includes(permission)) {
      throw new Error(
        `${relative(repositoryRoot.pathname, file)} is missing required permission ${permission}.`,
      );
    }
  }
  if (hostPermissions.length > 0) {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} must not request host permissions: ${hostPermissions.join(', ')}`,
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

  const gecko = manifest.browser_specific_settings?.gecko;
  if (gecko && gecko.strict_min_version !== '91.1.0') {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} must pin Firefox proxy API minimum 91.1.0.`,
    );
  }

  console.log(
    `${relative(repositoryRoot.pathname, file)} passed: MV${manifest.manifest_version}, proxy/storage only, no host access.`,
  );
}
