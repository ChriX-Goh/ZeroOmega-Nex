import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

import { afterEach, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const rootDir = resolve('.');
const scriptPath = resolve('scripts/owner-corpus-b-intake.mjs');
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

async function prepare() {
  const directory = await mkdtemp(join(tmpdir(), 'zeroomega-corpus-b-'));
  temporaryDirectories.push(directory);
  const source = await readFile(fixturePath, 'utf8');
  const rawPath = join(directory, 'owner-raw.bak');
  const candidatePath = join(directory, 'owner-sanitized.bak');
  const manifestPath = join(directory, 'corpus-b-structure.json');
  await writeFile(rawPath, source, 'utf8');
  const data = JSON.parse(source) as JsonObject;
  return { source, data, rawPath, candidatePath, manifestPath };
}

async function run(args: string[]) {
  return execFileAsync(process.execPath, [scriptPath, ...args], { cwd: rootDir });
}

async function failure(args: string[]): Promise<string> {
  try {
    await run(args);
  } catch (error) {
    if (error instanceof Error && 'stderr' in error) {
      return String((error as Error & { stderr?: unknown }).stderr ?? '');
    }
    throw error;
  }
  throw new Error('expected Corpus B intake command to fail');
}

async function inspect(rawPath: string, manifestPath: string) {
  const result = await run(['inspect', rawPath, manifestPath]);
  expect(result.stdout).toContain('Corpus B raw structure captured without raw values');
}

async function writeCandidate(path: string, data: JsonObject) {
  await writeFile(path, `${JSON.stringify(data)}\n`, 'utf8');
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('owner Corpus B intake CLI', () => {
  it('creates a value-free manifest and accepts a structurally equivalent sanitized candidate', async () => {
    const { data, rawPath, candidatePath, manifestPath } = await prepare();
    await inspect(rawPath, manifestPath);

    const manifest = await readFile(manifestPath, 'utf8');
    expect(manifest).not.toContain('nested.corpus.example.com');
    expect(manifest).not.toContain('corpus proxy');
    expect(manifest).not.toContain('proxy-corpus.example.com');
    expect(manifest).not.toContain('配置.pac');
    expect(JSON.parse(manifest)).toMatchObject({ containsRawValues: false, manifestVersion: 1 });

    object(data['+PAC 中文']).pacUrl = 'https://pac.example.com/redacted';
    await writeCandidate(candidatePath, data);
    const result = await run(['verify', candidatePath, manifestPath]);
    expect(result.stdout).toContain('Corpus B sanitized candidate passed structure and safety intake');
  });

  it('rejects profile-family structural drift', async () => {
    const { data, rawPath, candidatePath, manifestPath } = await prepare();
    await inspect(rawPath, manifestPath);
    object(data['+inner switch']).profileType = 'FixedProfile';
    await writeCandidate(candidatePath, data);

    expect(await failure(['verify', candidatePath, manifestPath])).toMatch(/structural fingerprint changed/u);
  });

  it('binds Rule List ordering and PAC syntax shape', async () => {
    const { data, rawPath, candidatePath, manifestPath } = await prepare();
    await inspect(rawPath, manifestPath);

    const rules = object(data['+corpus rules']);
    rules.ruleList = text(rules.ruleList).split(/\r?\n/u).reverse().join('\n');
    await writeCandidate(candidatePath, data);
    expect(await failure(['verify', candidatePath, manifestPath])).toMatch(/structural fingerprint changed/u);

    const second = await prepare();
    await inspect(second.rawPath, second.manifestPath);
    const pac = object(second.data['+PAC 中文']);
    pac.pacScript = text(pac.pacScript).replace('return "DIRECT";', 'if (true) return "DIRECT";');
    await writeCandidate(second.candidatePath, second.data);
    expect(await failure(['verify', second.candidatePath, second.manifestPath])).toMatch(
      /structural fingerprint changed/u,
    );
  });

  it('rejects usable credentials and non-reserved endpoints', async () => {
    const { data, rawPath, candidatePath, manifestPath } = await prepare();
    await inspect(rawPath, manifestPath);
    const proxy = object(data['+corpus proxy']);
    object(proxy.fallbackProxy).host = '10.23.45.67';
    proxy.auth = { all: { username: 'owner-user', password: 'owner-password' } };
    await writeCandidate(candidatePath, data);

    expect(await failure(['verify', candidatePath, manifestPath])).toMatch(
      /usable network endpoint|non-reserved network identifier|unredacted proxy credential/u,
    );
  });

  it('rejects URL credentials/query/path data and non-documentation IPv6 identifiers', async () => {
    const { data, rawPath, candidatePath, manifestPath } = await prepare();
    await inspect(rawPath, manifestPath);
    const pac = object(data['+PAC 中文']);
    pac.pacUrl = 'https://owner:secret@pac.example.com/private?token=secret#owner';
    pac.pacScript = `${text(pac.pacScript)}\nreturn "PROXY [fd00::1234]:8080";`;
    await writeCandidate(candidatePath, data);

    expect(await failure(['verify', candidatePath, manifestPath])).toMatch(
      /URL credentials|URL query or fragment|URL path|non-reserved network identifier/u,
    );
  });

  it('refuses to inspect a raw owner backup from inside the repository', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'zeroomega-corpus-b-manifest-'));
    temporaryDirectories.push(directory);
    const stderr = await failure(['inspect', fixturePath, join(directory, 'manifest.json')]);
    expect(stderr).toMatch(/raw owner backup must stay outside the repository/u);
  });
});
