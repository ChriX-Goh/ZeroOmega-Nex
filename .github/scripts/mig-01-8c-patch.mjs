import { readFile, writeFile } from 'node:fs/promises';

async function replaceAll(path, replacements) {
  let source = await readFile(path, 'utf8');
  for (const [from, to] of replacements) {
    if (!source.includes(from)) {
      throw new Error(`patch anchor missing in ${path}: ${from.slice(0, 80)}`);
    }
    source = source.replace(from, to);
  }
  await writeFile(path, source, 'utf8');
}

await replaceAll('scripts/owner-corpus-b-intake.mjs', [
  [
    "import assert from 'node:assert/strict';\n",
    "import { isDeepStrictEqual } from 'node:util';\n",
  ],
  [
    "function fail(message) {\n  throw new Error(message);\n}\n",
    "export class CorpusBIntakeError extends Error {}\n\nfunction fail(message) {\n  throw new CorpusBIntakeError(message);\n}\n\nexport function corpusBIntakeErrorMessage(error) {\n  return error instanceof CorpusBIntakeError\n    ? error.message\n    : 'Corpus B intake failed without exposing local path details';\n}\n",
  ],
  [
    "  assert.deepEqual(current.metrics, manifest.metrics, 'sanitized candidate metrics changed');\n",
    "  if (!isDeepStrictEqual(current.metrics, manifest.metrics)) {\n    fail('sanitized candidate rejected: aggregate metrics changed');\n  }\n",
  ],
  [
    "    console.error(error instanceof Error ? error.message : 'Corpus B intake failed');\n",
    "    console.error(corpusBIntakeErrorMessage(error));\n",
  ],
]);

await replaceAll('scripts/owner-corpus-b-preflight.mjs', [
  [
    "import { parseBackup, verifyAgainstManifest } from './owner-corpus-b-intake.mjs';\n",
    "import {\n  CorpusBIntakeError,\n  parseBackup,\n  verifyAgainstManifest,\n} from './owner-corpus-b-intake.mjs';\n",
  ],
  [
    "function fail(message) {\n  throw new Error(message);\n}\n",
    "class CorpusBPreflightError extends Error {}\n\nfunction fail(message) {\n  throw new CorpusBPreflightError(message);\n}\n\nfunction corpusBPreflightErrorMessage(error) {\n  if (error instanceof CorpusBPreflightError || error instanceof CorpusBIntakeError) {\n    return error.message;\n  }\n  return 'Corpus B repository preflight failed without exposing local path details';\n}\n",
  ],
  ["    stdio: 'inherit',\n", "    stdio: ['ignore', 'ignore', 'ignore'],\n"],
  [
    "    fail(`preflight runner wrote unknown decision: ${report.decision.status}`);\n",
    "    fail('preflight runner wrote unknown decision');\n",
  ],
  [
    "    console.error(error instanceof Error ? error.message : 'Corpus B repository preflight failed');\n",
    "    console.error(corpusBPreflightErrorMessage(error));\n",
  ],
]);

await replaceAll('packages/legacy-zeroomega/src/owner-corpus-b-intake.test.ts', [
  [
    "  it('refuses to inspect a raw owner backup from inside the repository', async () => {\n",
    "  it('does not expose a missing raw owner path in failure output', async () => {\n    const directory = await mkdtemp(join(tmpdir(), 'zeroomega-corpus-b-private-path-'));\n    temporaryDirectories.push(directory);\n    const privateSegment = 'OWNER_PRIVATE_RAW_PATH_SECRET';\n    const rawPath = join(directory, privateSegment, 'owner.bak');\n    const manifestPath = join(directory, 'manifest.json');\n\n    const stderr = await failure(['inspect', rawPath, manifestPath]);\n    expect(stderr).toContain('Corpus B intake failed without exposing local path details');\n    expect(stderr).not.toContain(privateSegment);\n    expect(stderr).not.toContain(rawPath);\n  });\n\n  it('refuses to inspect a raw owner backup from inside the repository', async () => {\n",
  ],
]);

await replaceAll('scripts/owner-corpus-b-preflight.test.ts', [
  [
    "import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';\n",
    "import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';\n",
  ],
  [
    "    expect(reportSource).not.toContain('OWNER_PRIVATE_PROFILE');\n    expect(reportSource).not.toContain('owner-private.example.com');\n  });\n});\n",
    "    expect(reportSource).not.toContain('OWNER_PRIVATE_PROFILE');\n    expect(reportSource).not.toContain('owner-private.example.com');\n  });\n\n  it('suppresses internal runner paths from public failure output', async () => {\n    const { directory, candidateSource, manifest } = await prepare();\n    const candidatePath = join(directory, 'owner-sanitized.bak');\n    const manifestPath = join(directory, 'corpus-b-structure.json');\n    const privateSegment = 'OWNER_PRIVATE_REPORT_PATH_SECRET';\n    const reportPath = join(directory, privateSegment);\n    await Promise.all([\n      writeFile(candidatePath, candidateSource, 'utf8'),\n      writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\\n`, 'utf8'),\n      mkdir(reportPath),\n    ]);\n\n    let exitCode: unknown;\n    let stderr = '';\n    try {\n      await execFileAsync(\n        process.execPath,\n        [wrapperPath, candidatePath, manifestPath, reportPath],\n        {\n          cwd: rootDir,\n          env: process.env,\n          maxBuffer: 4 * 1024 * 1024,\n        },\n      );\n    } catch (error) {\n      if (error instanceof Error && 'code' in error && 'stderr' in error) {\n        exitCode = error.code;\n        stderr = String(error.stderr ?? '');\n      } else throw error;\n    }\n\n    expect(exitCode).toBe(1);\n    expect(stderr).toContain('repository preflight runner failed with exit code 1');\n    expect(stderr).not.toContain(privateSegment);\n    expect(stderr).not.toContain(reportPath);\n    expect(stderr).not.toContain(candidatePath);\n  });\n});\n",
  ],
]);
