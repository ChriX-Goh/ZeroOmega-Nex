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

function assertExactSet(actual, expected, label, file) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  if (
    actualSet.size !== expectedSet.size ||
    [...expectedSet].some((value) => !actualSet.has(value))
  ) {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} has invalid ${label}: ${actual.join(', ') || '(none)'}`,
    );
  }
}

const files = await walk(outputRoot);
const manifestFiles = files.filter((file) => basename(file) === 'manifest.json');

if (manifestFiles.length < 2) {
  throw new Error(`Expected Chromium and Firefox manifests, found ${manifestFiles.length}.`);
}

for (const file of manifestFiles) {
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
  const optionalPermissions = Array.isArray(manifest.optional_permissions)
    ? manifest.optional_permissions
    : [];
  const hostPermissions = Array.isArray(manifest.host_permissions) ? manifest.host_permissions : [];
  const optionalHostPermissions = Array.isArray(manifest.optional_host_permissions)
    ? manifest.optional_host_permissions
    : [];
  const gecko = manifest.browser_specific_settings?.gecko;

  assertExactSet(permissions, ['proxy', 'storage'], 'required permissions', file);
  assertExactSet(
    optionalPermissions,
    gecko ? ['webRequest', 'webRequestBlocking'] : ['webRequest', 'webRequestAuthProvider'],
    'optional permissions',
    file,
  );
  assertExactSet(
    optionalHostPermissions,
    ['http://*/*', 'https://*/*'],
    'optional host permissions',
    file,
  );
  if (hostPermissions.length > 0) {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} must not request required host permissions: ${hostPermissions.join(', ')}`,
    );
  }
  if (
    [
      ...permissions,
      ...optionalPermissions,
      ...hostPermissions,
      ...optionalHostPermissions,
    ].includes('<all_urls>')
  ) {
    throw new Error(`${relative(repositoryRoot.pathname, file)} must not request <all_urls>.`);
  }
  if (!manifest.action?.default_popup) {
    throw new Error(`${relative(repositoryRoot.pathname, file)} is missing the popup entrypoint.`);
  }
  if (!manifest.options_ui?.page) {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} is missing the options entrypoint.`,
    );
  }
  if (gecko && gecko.strict_min_version !== '91.1.0') {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} must pin Firefox proxy API minimum 91.1.0.`,
    );
  }

  console.log(
    `${relative(repositoryRoot.pathname, file)} passed: MV${manifest.manifest_version}, proxy/storage required, auth optional, no global host access.`,
  );
}
