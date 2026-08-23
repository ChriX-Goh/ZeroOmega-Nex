import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import { assertNoMigrationSecretSentinels } from './migration-secret-sentinels.mjs';

const diagnosticsRoot = resolve(process.argv[2] ?? 'tmp/migration-secret-diagnostics');
const repository = process.env.GITHUB_REPOSITORY;
const runId = process.env.GITHUB_RUN_ID;
const token = process.env.GITHUB_TOKEN;
if (!repository || !runId || !token) {
  throw new Error(
    'GitHub repository, run ID, and token are required for migration secret log gate',
  );
}

async function scanTree(path) {
  let scanned = 0;
  for (const entry of await readdir(path)) {
    const candidate = resolve(path, entry);
    const info = await stat(candidate);
    if (info.isDirectory()) {
      scanned += await scanTree(candidate);
      continue;
    }
    assertNoMigrationSecretSentinels(
      await readFile(candidate, 'utf8'),
      `diagnostic artifact ${entry}`,
    );
    scanned += 1;
  }
  return scanned;
}

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error(`GitHub API ${path} failed with ${response.status}`);
  return response;
}

const scannedFiles = await scanTree(diagnosticsRoot);
const jobsResponse = await github(`/repos/${repository}/actions/runs/${runId}/jobs?per_page=100`);
const jobs = (await jobsResponse.json()).jobs ?? [];
const requiredJobs = ['chromium', 'firefox'];
for (const requiredName of requiredJobs) {
  const job = jobs.find((candidate) => String(candidate.name).toLowerCase() === requiredName);
  if (!job) throw new Error(`Required browser job ${requiredName} was not found`);
  if (job.conclusion !== 'success') {
    throw new Error(
      `Required browser job ${requiredName} concluded ${job.conclusion ?? 'unknown'}`,
    );
  }
  const logsResponse = await github(`/repos/${repository}/actions/jobs/${job.id}/logs`);
  assertNoMigrationSecretSentinels(await logsResponse.text(), `Actions job log ${requiredName}`);
}

console.log(
  `Migration secret leak gate passed across ${scannedFiles} diagnostics files and ${requiredJobs.length} browser job logs.`,
);
