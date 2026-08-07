import { readFile, writeFile } from 'node:fs/promises';

const replacement = `const sourceOptions = JSON.parse(await readFile(fixturePath, 'utf8'));\n  for (const slot of ['fallbackProxy', 'all']) {\n    sourceOptions['+authenticated-proxy'].auth[slot].username = 'fixture-user';\n    sourceOptions['+authenticated-proxy'].auth[slot].password = sentinel;\n  }\n  for (const profileName of ['+header-rule-list', '+header-pac']) {\n    for (const header of sourceOptions[profileName].headers ?? []) {\n      if (/authorization|token/i.test(header.name)) header.value = sentinel;\n    }\n  }\n  await writeFile(inputPath, JSON.stringify(sourceOptions));`;

for (const path of [
  'scripts/e2e-chromium-mig01-secret-leak.mjs',
  'scripts/e2e-firefox-mig01-secret-leak.mjs',
]) {
  let text = await readFile(path, 'utf8');
  const needle = `const source = (await readFile(fixturePath, 'utf8')).replaceAll('<redacted>', sentinel);\n  await writeFile(inputPath, source);`;
  if (!text.includes(needle)) throw new Error(`${path}: sentinel injection anchor missing`);
  text = text.replace(needle, replacement);
  await writeFile(path, text);
}
