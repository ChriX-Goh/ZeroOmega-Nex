import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';

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

  assertExactSet(
    permissions,
    ['proxy', 'storage', 'alarms', 'activeTab', 'contextMenus', 'tabs'],
    'required permissions',
    file,
  );
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
  const expectedPopup = gecko ? 'popup/index.html' : 'popup-iframe.html';
  if (manifest.action?.default_popup !== expectedPopup) {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} has invalid Action popup: ${manifest.action?.default_popup ?? '(missing)'}`,
    );
  }
  if (manifest.action?.default_title !== '__MSG_manifest_icon_default_title__') {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} has invalid Action default title: ${manifest.action?.default_title ?? '(missing)'}`,
    );
  }
  const actionIcons = manifest.action?.default_icon ?? {};
  assertExactSet(Object.keys(actionIcons), ['16', '19', '24', '32'], 'Action icon sizes', file);
  for (const [size, iconPath] of Object.entries(actionIcons)) {
    if (iconPath !== `icon/original-action-${size}.png`) {
      throw new Error(
        `${relative(repositoryRoot.pathname, file)} has invalid Action icon ${size}: ${iconPath}`,
      );
    }
  }
  const executeAction = manifest.commands?._execute_browser_action;
  if (executeAction?.suggested_key?.default !== 'Alt+Shift+O') {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} has invalid Action shortcut: ${executeAction?.suggested_key?.default ?? '(missing)'}`,
    );
  }
  if (executeAction?.description !== 'Toggle the proxy setting') {
    throw new Error(
      `${relative(repositoryRoot.pathname, file)} has invalid Action shortcut description.`,
    );
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
    `${relative(repositoryRoot.pathname, file)} passed: MV${manifest.manifest_version}, proxy/storage/alarms/activeTab/contextMenus/tabs required, auth optional, no global host access.`,
  );
}

const javascriptFiles = files.filter((file) => extname(file) === '.js');
const cspViolations = [];
for (const file of javascriptFiles) {
  const source = await readFile(file, 'utf8');
  if (/\bFunction\s*\(/u.test(source) || /\bnew\s+Function\s*\(/u.test(source)) {
    cspViolations.push(
      `${relative(repositoryRoot.pathname, file)} contains dynamic Function construction`,
    );
  }
  if (source.includes('Error compiling schema, function code:')) {
    cspViolations.push(
      `${relative(repositoryRoot.pathname, file)} contains the Ajv runtime schema compiler`,
    );
  }
}
if (cspViolations.length > 0) {
  throw new Error(
    `Built extension violates MV3 script CSP:\n${cspViolations.map((entry) => `- ${entry}`).join('\n')}`,
  );
}
console.log(`CSP audit passed for ${javascriptFiles.length} built JavaScript files.`);
