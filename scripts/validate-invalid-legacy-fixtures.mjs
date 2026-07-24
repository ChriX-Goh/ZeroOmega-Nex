import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const invalidDir = path.join(rootDir, 'fixtures', 'zeroomega-v2', 'invalid');
const expectationFile = path.join(invalidDir, 'expectations.json');
const validator = path.join(rootDir, 'scripts', 'validate-legacy-fixtures.mjs');

const expectations = JSON.parse(await readFile(expectationFile, 'utf8'));

if (!Array.isArray(expectations) || expectations.length === 0) {
  throw new Error('Invalid fixture expectations must be a non-empty array');
}

for (const expectation of expectations) {
  if (
    !expectation ||
    typeof expectation.file !== 'string' ||
    typeof expectation.contains !== 'string'
  ) {
    throw new Error('Each invalid fixture expectation requires file and contains strings');
  }

  const fixture = path.join(invalidDir, expectation.file);
  const relativeFixture = path.relative(rootDir, fixture);
  const result = spawnSync(process.execPath, [validator, relativeFixture], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;

  if (result.status === 0) {
    throw new Error(`${expectation.file}: validator unexpectedly accepted invalid input`);
  }
  if (!output.includes(expectation.contains)) {
    throw new Error(
      `${expectation.file}: expected failure containing ${JSON.stringify(expectation.contains)}, received:\n${output}`,
    );
  }
}

console.log(
  `Confirmed ${expectations.length} invalid legacy fixtures fail for the expected reasons.`,
);
