import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LARGE_FIXTURE_PATH,
  serializeLargeLegacyFixture,
} from './large-legacy-fixture-lib.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(rootDir, LARGE_FIXTURE_PATH);

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, serializeLargeLegacyFixture(), 'utf8');
console.log(`Generated ${LARGE_FIXTURE_PATH}.`);
