import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

import { buildManifest, parseBackup, verifyAgainstManifest } from './owner-corpus-b-intake.mjs';
import { buildSafeCorpusBPreflightReport } from './owner-corpus-b-preflight-core.ts';

const execFileAsync = promisify(execFile);
const rootDir = resolve('.');
const wrapperPath = resolve('scripts/owner-corpus-b-preflight.mjs');
const fixturePath = resolve('fixtures/zeroomega-v2/original-complex-corpus-cd-v3.5.0.bak');
const temporaryDirectories: string[] = [];

type JsonObject = Record<string, unknown>;

function object(value: unknown): JsonObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('expected object');
  }
  return value as JsonObject;
}

function text(value: unknown): string {
  if (typeof value !== 'string') throw new Error('expected string');
  return value;
}

function replaceStrings(value: unknown, from: string, to: string): void {
  if (Array.isArray(value)) {
    value.forEach((item) => replaceStrings(item, from, to));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (item === from) {
      (value as JsonObject)[key] = to;
      continue;
    }
    replaceStrings(item, from, to);
  }
}

async function prepare() {
  const directory = await mkdtemp(join(tmpdir(), 'zeroomega-corpus-b-preflight-test-'));
  temporaryDirectories.push(directory);
  const data = JSON.parse(await readFile(fixturePath, 'utf8')) as JsonObject;
  const privateName = 'OWNER_PRIVATE_PROFILE';

  replaceStrings(data, 'corpus proxy', privateName);
  data[`+${privateName}`] = data['+corpus proxy'];
  delete data['+corpus proxy'];
  object(data[`+${privateName}`]).name = privateName;
  object(object(data[`+${privateName}`]).fallbackProxy).host = 'owner-private.example.com';
  const pac = object(data['+PAC 中文']);
  pac.pacScript = text(pac.pacScript).replace(
    'proxy-corpus.example.com',
    'owner-private.example.com',
  );

  const rawSource = `${JSON.stringify(data)}\n`;
  const manifest = buildManifest(
    parseBackup(rawSource, 'raw owner backup'),
    Buffer.byteLength(rawSource),
  );

  pac.pacUrl = 'https://pac.example.com/redacted';
  const candidateSource = `${JSON.stringify(data)}\n`;
  const metrics = verifyAgainstManifest(
    parseBackup(candidateSource, 'sanitized owner backup'),
    manifest,
  );

  return {
    directory,
    data,
    privateName,
    candidateSource,
    manifest,
    metrics,
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('owner Corpus B repository preflight', () => {
  it('runs the real importer and emits only safe aggregate evidence', async () => {
    const { candidateSource, privateName, metrics } = await prepare();
    const report = buildSafeCorpusBPreflightReport(candidateSource, metrics);
    const reportSource = JSON.stringify(report);

    expect(report).toMatchObject({
      reportVersion: 1,
      role: 'owner-representative-import-preflight',
      containsRawValues: false,
      intake: { verified: true },
      importer: { ok: true },
      decision: {
        status: 'review-required',
        readyForBrowserChain: false,
        reason: 'target-dependent-items-present',
      },
    });
    expect(reportSource).not.toContain(privateName);
    expect(reportSource).not.toContain('owner-private.example.com');
    expect(reportSource).not.toContain('PAC 中文');
    expect(reportSource).not.toContain('配置.pac');
  });

  it('blocks on importer rejection without copying private source values into the report', async () => {
    const { data, privateName } = await prepare();
    const missingTarget = 'OWNER_PRIVATE_MISSING_TARGET';
    object(data['+outer switch']).defaultProfileName = missingTarget;
    const source = `${JSON.stringify(data)}\n`;
    const manifest = buildManifest(
      parseBackup(source, 'raw owner backup'),
      Buffer.byteLength(source),
    );
    const metrics = verifyAgainstManifest(parseBackup(source, 'sanitized owner backup'), manifest);
    const report = buildSafeCorpusBPreflightReport(source, metrics);
    const reportSource = JSON.stringify(report);

    expect(report).toMatchObject({
      containsRawValues: false,
      importer: { ok: false },
      decision: {
        status: 'blocked',
        readyForBrowserChain: false,
        reason: 'import-rejected',
      },
    });
    expect(report.importer.issues.some((issue) => issue.status === 'rejected')).toBe(true);
    expect(reportSource).not.toContain(privateName);
    expect(reportSource).not.toContain(missingTarget);
    expect(reportSource).not.toContain('owner-private.example.com');
  });

  it('writes a safe report and exits non-zero when public preflight requires review', async () => {
    const { directory, candidateSource, manifest } = await prepare();
    const candidatePath = join(directory, 'owner-sanitized.bak');
    const manifestPath = join(directory, 'corpus-b-structure.json');
    const reportPath = join(directory, 'corpus-b-preflight.json');
    await Promise.all([
      writeFile(candidatePath, candidateSource, 'utf8'),
      writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
    ]);

    let exitCode: unknown;
    try {
      await execFileAsync(
        process.execPath,
        [wrapperPath, candidatePath, manifestPath, reportPath],
        {
          cwd: rootDir,
          env: process.env,
          maxBuffer: 4 * 1024 * 1024,
        },
      );
    } catch (error) {
      if (error instanceof Error && 'code' in error) exitCode = error.code;
      else throw error;
    }
    expect(exitCode).toBe(3);

    const reportSource = await readFile(reportPath, 'utf8');
    expect(JSON.parse(reportSource)).toMatchObject({
      reportVersion: 1,
      containsRawValues: false,
      importer: { ok: true },
      decision: {
        status: 'review-required',
        readyForBrowserChain: false,
        reason: 'target-dependent-items-present',
      },
    });
    expect(reportSource).not.toContain('OWNER_PRIVATE_PROFILE');
    expect(reportSource).not.toContain('owner-private.example.com');
  });

  it('suppresses internal runner paths from public failure output', async () => {
    const { directory, candidateSource, manifest } = await prepare();
    const candidatePath = join(directory, 'owner-sanitized.bak');
    const manifestPath = join(directory, 'corpus-b-structure.json');
    const privateSegment = 'OWNER_PRIVATE_REPORT_PATH_SECRET';
    const reportPath = join(directory, privateSegment);
    await Promise.all([
      writeFile(candidatePath, candidateSource, 'utf8'),
      writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
      mkdir(reportPath),
    ]);

    let exitCode: unknown;
    let stderr = '';
    try {
      await execFileAsync(
        process.execPath,
        [wrapperPath, candidatePath, manifestPath, reportPath],
        {
          cwd: rootDir,
          env: process.env,
          maxBuffer: 4 * 1024 * 1024,
        },
      );
    } catch (error) {
      if (error instanceof Error && 'code' in error && 'stderr' in error) {
        exitCode = error.code;
        stderr = String(error.stderr ?? '');
      } else throw error;
    }

    expect(exitCode).toBe(1);
    expect(stderr).toContain('repository preflight runner failed with exit code 1');
    expect(stderr).not.toContain(privateSegment);
    expect(stderr).not.toContain(reportPath);
    expect(stderr).not.toContain(candidatePath);
  });
});
