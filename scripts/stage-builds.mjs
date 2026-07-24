import { cp, mkdir, readdir, rm } from 'node:fs/promises';

const outputRoot = new URL('../dist/', import.meta.url);
const stageRoot = new URL('../browser-builds/', import.meta.url);

await rm(stageRoot, { recursive: true, force: true });
await mkdir(stageRoot, { recursive: true });
await cp(outputRoot, stageRoot, { recursive: true });

const targets = await readdir(stageRoot);
if (targets.length < 2) {
  throw new Error(`Expected at least two staged browser targets, found ${targets.length}.`);
}

console.log(`Staged browser targets: ${targets.join(', ')}`);
