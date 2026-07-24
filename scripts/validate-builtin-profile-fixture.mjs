import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(rootDir, 'fixtures', 'zeroomega-v2', 'builtin-profile-colors.json');
const allowedFields = new Set(['name', 'profileType', 'color', 'builtin']);
const expectedProfiles = {
  '+direct': { name: 'direct', profileType: 'DirectProfile' },
  '+system': { name: 'system', profileType: 'SystemProfile' },
};

function fail(message) {
  throw new Error(`builtin-profile-colors.json: ${message}`);
}

const data = JSON.parse(await readFile(fixturePath, 'utf8'));
if (data.schemaVersion !== 2) {
  fail('schemaVersion must equal 2');
}

const customizations = data['-builtinProfiles'];
if (!customizations || typeof customizations !== 'object' || Array.isArray(customizations)) {
  fail('-builtinProfiles must be an object');
}

const keys = Object.keys(customizations).sort();
const expectedKeys = Object.keys(expectedProfiles).sort();
if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
  fail(`expected keys ${expectedKeys.join(', ')}, received ${keys.join(', ')}`);
}

for (const [key, expected] of Object.entries(expectedProfiles)) {
  const profile = customizations[key];
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
    fail(`${key} must be an object`);
  }

  for (const field of Object.keys(profile)) {
    if (!allowedFields.has(field)) {
      fail(`${key} contains routing or unknown field ${JSON.stringify(field)}`);
    }
  }

  if (profile.name !== expected.name) {
    fail(`${key}.name must equal ${JSON.stringify(expected.name)}`);
  }
  if (profile.profileType !== expected.profileType) {
    fail(`${key}.profileType must equal ${JSON.stringify(expected.profileType)}`);
  }
  if (profile.builtin !== true) {
    fail(`${key}.builtin must equal true`);
  }
  if (typeof profile.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(profile.color)) {
    fail(`${key}.color must be a six-digit hexadecimal color`);
  }
}

console.log('Validated built-in profile appearance fixture for direct and system.');
