import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  CorpusBIntakeError,
  isInsideRepository,
  parseBackup,
  verifyAgainstManifest,
} from './owner-corpus-b-intake.mjs';

const rootDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const runnerConfig = resolve(rootDir, 'scripts/owner-corpus-b-preflight.vitest.config.ts');

class CorpusBPreflightError extends Error {}

function fail(message) {
  throw new CorpusBPreflightError(message);
}

function corpusBPreflightErrorMessage(error) {
  if (error instanceof CorpusBPreflightError || error instanceof CorpusBIntakeError) {
    return error.message;
  }
  return 'Corpus B repository preflight failed without exposing local path details';
}

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function readManifest(path) {
  const source = await readFile(path, 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(source);
  } catch {
    fail('manifest: invalid JSON');
  }
  if (!object(manifest)) fail('manifest: root must be an object');
  return manifest;
}

async function runImporterPreflight(candidatePath, manifestPath, reportPath) {
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const child = spawn(pnpm, ['exec', 'vitest', 'run', '--config', runnerConfig], {
    cwd: rootDir,
    env: {
      ...process.env,
      ZEROOMEGA_CORPUS_B_PREFLIGHT_CANDIDATE: candidatePath,
      ZEROOMEGA_CORPUS_B_PREFLIGHT_MANIFEST: manifestPath,
      ZEROOMEGA_CORPUS_B_PREFLIGHT_REPORT: reportPath,
    },
    stdio: ['ignore', 'ignore', 'ignore'],
  });

  const exitCode = await new Promise((resolveExit, rejectExit) => {
    child.once('error', rejectExit);
    child.once('exit', resolveExit);
  });
  if (exitCode !== 0) fail(`repository preflight runner failed with exit code ${exitCode}`);
}

export async function preflightCommand(sanitizedPath, manifestPath, reportPath) {
  if (!sanitizedPath || !manifestPath || !reportPath) {
    fail(
      'usage: owner-corpus-b-preflight.mjs <sanitized-owner.bak> <structure-manifest.json> <safe-report.json>',
    );
  }
  if (isInsideRepository(sanitizedPath))
    fail('sanitized owner backup must stay outside the repository');
  if (isInsideRepository(reportPath)) fail('preflight report must stay outside the repository');

  const candidatePath = resolve(sanitizedPath);
  const manifestFile = resolve(manifestPath);
  const reportFile = resolve(reportPath);

  const [source, manifest] = await Promise.all([
    readFile(candidatePath, 'utf8'),
    readManifest(manifestFile),
  ]);
  const backup = parseBackup(source, 'sanitized owner backup');
  verifyAgainstManifest(backup, manifest);

  await runImporterPreflight(candidatePath, manifestFile, reportFile);

  const reportSource = await readFile(reportFile, 'utf8');
  let report;
  try {
    report = JSON.parse(reportSource);
  } catch {
    fail('preflight runner wrote invalid report JSON');
  }
  if (!object(report) || !object(report.decision) || typeof report.decision.status !== 'string') {
    fail('preflight runner wrote invalid report shape');
  }

  console.log(`Corpus B repository preflight: ${report.decision.status}.`);
  if (report.decision.status === 'blocked') process.exitCode = 2;
  else if (report.decision.status === 'review-required') process.exitCode = 3;
  else if (report.decision.status !== 'ready-for-browser-chain') {
    fail('preflight runner wrote unknown decision');
  }
}

const isMain =
  typeof process.argv[1] === 'string' &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  try {
    await preflightCommand(...process.argv.slice(2, 5));
  } catch (error) {
    console.error(corpusBPreflightErrorMessage(error));
    process.exitCode = 1;
  }
}
