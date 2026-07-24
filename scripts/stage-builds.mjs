import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = new URL('../', import.meta.url);
const outputRoot = new URL('../dist/', import.meta.url);
const stageRoot = new URL('../browser-builds/', import.meta.url);
const archive = new URL('../browser-builds.tar.gz', import.meta.url);

await rm(stageRoot, { recursive: true, force: true });
await rm(archive, { force: true });
await mkdir(stageRoot, { recursive: true });
await cp(outputRoot, stageRoot, { recursive: true });

const targets = await readdir(stageRoot);
if (targets.length < 2) {
  throw new Error(`Expected at least two staged browser targets, found ${targets.length}.`);
}

const result = spawnSync(
  'tar',
  ['-czf', fileURLToPath(archive), '-C', fileURLToPath(repositoryRoot), 'browser-builds'],
  { encoding: 'utf8' },
);
if (result.status !== 0) {
  throw new Error(`Unable to archive browser builds: ${result.stderr || result.stdout}`);
}

console.log(`Staged and archived browser targets: ${targets.join(', ')}`);
