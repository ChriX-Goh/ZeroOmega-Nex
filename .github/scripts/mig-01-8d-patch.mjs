import { readFile, writeFile } from 'node:fs/promises';

async function edit(path, edits) {
  let source = await readFile(path, 'utf8');
  for (const [from, to] of edits) {
    if (!source.includes(from)) throw new Error(`patch anchor missing in ${path}`);
    source = source.replace(from, to);
  }
  await writeFile(path, source, 'utf8');
}

await edit('scripts/owner-corpus-b-intake.mjs', [
  [
    `export async function verifyCommand(sanitizedPath, manifestPath) {\n  if (!sanitizedPath || !manifestPath)\n    fail('usage: verify <sanitized-owner.bak> <structure-manifest.json>');\n  const [source, manifestSource] = await Promise.all([`,
    `export async function verifyCommand(sanitizedPath, manifestPath) {\n  if (!sanitizedPath || !manifestPath)\n    fail('usage: verify <sanitized-owner.bak> <structure-manifest.json>');\n  if (isInsideRepository(sanitizedPath))\n    fail('sanitized owner backup must stay outside the repository');\n  const [source, manifestSource] = await Promise.all([`,
  ],
]);

await edit('scripts/owner-corpus-b-preflight.mjs', [
  [
    `import {\n  CorpusBIntakeError,\n  parseBackup,\n  verifyAgainstManifest,\n} from './owner-corpus-b-intake.mjs';`,
    `import {\n  CorpusBIntakeError,\n  isInsideRepository,\n  parseBackup,\n  verifyAgainstManifest,\n} from './owner-corpus-b-intake.mjs';`,
  ],
  [
    `  if (!sanitizedPath || !manifestPath || !reportPath) {\n    fail(\n      'usage: owner-corpus-b-preflight.mjs <sanitized-owner.bak> <structure-manifest.json> <safe-report.json>',\n    );\n  }\n\n  const candidatePath = resolve(sanitizedPath);`,
    `  if (!sanitizedPath || !manifestPath || !reportPath) {\n    fail(\n      'usage: owner-corpus-b-preflight.mjs <sanitized-owner.bak> <structure-manifest.json> <safe-report.json>',\n    );\n  }\n  if (isInsideRepository(sanitizedPath))\n    fail('sanitized owner backup must stay outside the repository');\n  if (isInsideRepository(reportPath)) fail('preflight report must stay outside the repository');\n\n  const candidatePath = resolve(sanitizedPath);`,
  ],
]);

await edit('packages/legacy-zeroomega/src/owner-corpus-b-intake.test.ts', [
  [
    `  it('refuses to inspect a raw owner backup from inside the repository', async () => {`,
    `  it('refuses to verify a sanitized owner backup from inside the repository', async () => {\n    const directory = await mkdtemp(join(tmpdir(), 'zeroomega-corpus-b-manifest-'));\n    temporaryDirectories.push(directory);\n    const stderr = await failure(['verify', fixturePath, join(directory, 'manifest.json')]);\n    expect(stderr).toMatch(/sanitized owner backup must stay outside the repository/u);\n    expect(stderr).not.toContain(fixturePath);\n  });\n\n  it('refuses to inspect a raw owner backup from inside the repository', async () => {`,
  ],
]);

await edit('scripts/owner-corpus-b-preflight.test.ts', [
  [
    `  return {\n    directory,\n    data,\n    privateName,\n    candidateSource,\n    manifest,\n    metrics,\n  };\n}\n\nafterEach(async () => {`,
    `  return {\n    directory,\n    data,\n    privateName,\n    candidateSource,\n    manifest,\n    metrics,\n  };\n}\n\nasync function wrapperFailure(args: string[]) {\n  try {\n    await execFileAsync(process.execPath, [wrapperPath, ...args], {\n      cwd: rootDir,\n      env: process.env,\n      maxBuffer: 4 * 1024 * 1024,\n    });\n  } catch (error) {\n    if (error instanceof Error && 'code' in error && 'stderr' in error) {\n      return { exitCode: error.code, stderr: String(error.stderr ?? '') };\n    }\n    throw error;\n  }\n  throw new Error('expected Corpus B preflight command to fail');\n}\n\nafterEach(async () => {`,
  ],
  [
    `  it('suppresses internal runner paths from public failure output', async () => {`,
    `  it('refuses a checkout-local sanitized candidate before importer execution', async () => {\n    const directory = await mkdtemp(join(tmpdir(), 'zeroomega-corpus-b-containment-'));\n    temporaryDirectories.push(directory);\n    const manifestPath = join(directory, 'manifest.json');\n    const reportPath = join(directory, 'report.json');\n\n    const failure = await wrapperFailure([fixturePath, manifestPath, reportPath]);\n    expect(failure.exitCode).toBe(1);\n    expect(failure.stderr).toContain('sanitized owner backup must stay outside the repository');\n    expect(failure.stderr).not.toContain(fixturePath);\n  });\n\n  it('refuses a checkout-local report output before importer execution', async () => {\n    const directory = await mkdtemp(join(tmpdir(), 'zeroomega-corpus-b-containment-'));\n    temporaryDirectories.push(directory);\n    const candidatePath = join(directory, 'owner-sanitized.bak');\n    const manifestPath = join(directory, 'manifest.json');\n    const privateSegment = 'OWNER_PRIVATE_CHECKOUT_REPORT_SECRET';\n    const reportPath = resolve(`${privateSegment}.json`);\n\n    const failure = await wrapperFailure([candidatePath, manifestPath, reportPath]);\n    expect(failure.exitCode).toBe(1);\n    expect(failure.stderr).toContain('preflight report must stay outside the repository');\n    expect(failure.stderr).not.toContain(privateSegment);\n    expect(failure.stderr).not.toContain(reportPath);\n  });\n\n  it('suppresses internal runner paths from public failure output', async () => {`,
  ],
]);
