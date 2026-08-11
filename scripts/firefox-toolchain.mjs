import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { dirname, basename, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

import { Builder } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';

import { firefoxService } from './firefox-service.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PRODUCT_ROOT = resolve(SCRIPT_DIR, '..');
const TOOLCHAIN_MANIFEST_PATH = resolve(SCRIPT_DIR, 'firefox-toolchain-manifest.json');
const CACHE_ROOT = resolve(PRODUCT_ROOT, '.cache', 'firefox-m1');
const DOWNLOAD_ROOT = resolve(CACHE_ROOT, 'downloads');
const FIREFOX_ROOT = resolve(CACHE_ROOT, 'firefox');
const GECKODRIVER_ROOT = resolve(CACHE_ROOT, 'geckodriver');
const PROFILE_ROOT = resolve(CACHE_ROOT, 'profiles');
const STATE_PATH = resolve(CACHE_ROOT, 'toolchain-state.json');
const FIREFOX_BUILD_ROOT = resolve(PRODUCT_ROOT, 'dist', 'firefox-mv3');
const PACKAGE_ROOT = resolve(PRODUCT_ROOT, 'browser-builds', 'firefox-m1');
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;

function relativeLabel(filePath) {
  return relative(PRODUCT_ROOT, filePath).split(sep).join('/') || '.';
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function sha256File(filePath) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(filePath)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

function validateAsset(name, asset) {
  if (!asset || typeof asset !== 'object') {
    throw new Error(`Firefox toolchain manifest is missing ${name}`);
  }
  if (!/^https:\/\//u.test(asset.url) || /latest|download\.mozilla\.org/u.test(asset.url)) {
    throw new Error(`${name} download URL must be a fixed official HTTPS URL`);
  }
  if (!SHA256_PATTERN.test(asset.sha256)) {
    throw new Error(`${name} manifest SHA-256 is missing or malformed`);
  }
  if (!asset.version || /latest|current|stable/u.test(asset.version)) {
    throw new Error(`${name} version must be fixed`);
  }
  if (!/^https:\/\//u.test(asset.sha256Source || '')) {
    throw new Error(`${name} manifest must cite an official SHA-256 source`);
  }
}

export function validateToolchainManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || manifest.platform !== 'win64') {
    throw new Error('Firefox toolchain manifest must target the fixed win64 M1 toolchain');
  }
  validateAsset('Firefox', manifest.firefox);
  validateAsset('geckodriver', manifest.geckodriver);
  return manifest;
}

export async function loadToolchainManifest() {
  return validateToolchainManifest(await readJson(TOOLCHAIN_MANIFEST_PATH));
}

function commandOutput(command, args) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

function assertVersion(label, output, version) {
  if (!output.includes(version)) {
    throw new Error(`${label} version mismatch: expected ${version}, got ${output}`);
  }
}

async function downloadAsset(asset, targetPath) {
  if (await exists(targetPath)) {
    const cachedHash = await sha256File(targetPath);
    if (cachedHash === asset.sha256) {
      return { downloaded: false, sha256: cachedHash };
    }
    throw new Error(
      `${basename(targetPath)} failed SHA-256 verification in ignored cache; remove ${relativeLabel(CACHE_ROOT)} and retry`,
    );
  }

  await mkdir(dirname(targetPath), { recursive: true });
  const partialPath = `${targetPath}.part-${process.pid}`;
  await rm(partialPath, { force: true });
  const response = await fetch(asset.url, { redirect: 'follow' });
  if (!response.ok || !response.body) {
    throw new Error(
      `Official download failed for ${basename(targetPath)}: HTTP ${response.status}`,
    );
  }

  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partialPath));
    const downloadedHash = await sha256File(partialPath);
    if (downloadedHash !== asset.sha256) {
      throw new Error(
        `${basename(targetPath)} failed SHA-256 verification: expected ${asset.sha256}, got ${downloadedHash}`,
      );
    }
    await rename(partialPath, targetPath);
    return { downloaded: true, sha256: downloadedHash };
  } catch (error) {
    await rm(partialPath, { force: true });
    throw error;
  }
}

async function moveAsideIfPresent(directory) {
  if (await exists(directory)) {
    await rename(directory, `${directory}.stale-${Date.now()}`);
  }
}

async function ensureFirefox(asset, installerPath) {
  const binaryPath = resolve(FIREFOX_ROOT, 'core', 'firefox.exe');
  if (await exists(binaryPath)) {
    const versionOutput = commandOutput(binaryPath, ['--version']);
    assertVersion('Firefox', versionOutput, asset.version);
    return { binaryPath, versionOutput, extracted: false };
  }

  const temporaryRoot = `${FIREFOX_ROOT}.tmp-${process.pid}-${Date.now()}`;
  await mkdir(temporaryRoot, { recursive: true });
  try {
    execFileSync('tar.exe', ['-xf', installerPath, '-C', temporaryRoot], {
      cwd: PRODUCT_ROOT,
      stdio: 'inherit',
      windowsHide: true,
    });
    const extractedBinaryPath = await findFile(temporaryRoot, 'firefox.exe');
    if (!(await exists(extractedBinaryPath))) {
      throw new Error(
        'Firefox installer completed without firefox.exe in the extraction directory',
      );
    }
    await moveAsideIfPresent(FIREFOX_ROOT);
    await rename(temporaryRoot, FIREFOX_ROOT);
  } catch (error) {
    await rm(temporaryRoot, { recursive: true, force: true });
    throw error;
  }

  const versionOutput = commandOutput(binaryPath, ['--version']);
  assertVersion('Firefox', versionOutput, asset.version);
  return { binaryPath, versionOutput, extracted: true };
}

async function findFile(directory, fileName) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === fileName.toLowerCase()) {
      return entryPath;
    }
    if (entry.isDirectory()) {
      const match = await findFile(entryPath, fileName);
      if (match) return match;
    }
  }
  return undefined;
}

async function ensureGeckodriver(asset, archivePath) {
  const binaryPath = resolve(GECKODRIVER_ROOT, 'geckodriver.exe');
  if (await exists(binaryPath)) {
    const versionOutput = commandOutput(binaryPath, ['--version']);
    assertVersion('geckodriver', versionOutput, asset.version);
    return { binaryPath, versionOutput, extracted: false };
  }

  const temporaryRoot = `${GECKODRIVER_ROOT}.tmp-${process.pid}-${Date.now()}`;
  await mkdir(temporaryRoot, { recursive: true });
  try {
    execFileSync('tar.exe', ['-xf', archivePath, '-C', temporaryRoot], {
      cwd: PRODUCT_ROOT,
      stdio: 'inherit',
      windowsHide: true,
    });
    const extractedBinaryPath = await findFile(temporaryRoot, 'geckodriver.exe');
    if (!extractedBinaryPath) {
      throw new Error('geckodriver archive completed without geckodriver.exe');
    }
    const rootBinaryPath = resolve(temporaryRoot, 'geckodriver.exe');
    if (extractedBinaryPath !== rootBinaryPath) {
      await cp(extractedBinaryPath, rootBinaryPath);
    }
    await moveAsideIfPresent(GECKODRIVER_ROOT);
    await rename(temporaryRoot, GECKODRIVER_ROOT);
  } catch (error) {
    await rm(temporaryRoot, { recursive: true, force: true });
    throw error;
  }

  const versionOutput = commandOutput(binaryPath, ['--version']);
  assertVersion('geckodriver', versionOutput, asset.version);
  return { binaryPath, versionOutput, extracted: true };
}

export async function setupToolchain() {
  if (process.platform !== 'win32') {
    throw new Error('The Firefox M1 portable toolchain is intentionally Windows-only');
  }

  const manifest = await loadToolchainManifest();
  await mkdir(DOWNLOAD_ROOT, { recursive: true });
  await mkdir(PROFILE_ROOT, { recursive: true });

  const firefoxInstallerPath = resolve(
    DOWNLOAD_ROOT,
    `Firefox Setup ${manifest.firefox.version}.exe`,
  );
  const geckodriverArchivePath = resolve(
    DOWNLOAD_ROOT,
    `geckodriver-v${manifest.geckodriver.version}-win64.zip`,
  );
  const firefoxDownload = await downloadAsset(manifest.firefox, firefoxInstallerPath);
  const geckodriverDownload = await downloadAsset(manifest.geckodriver, geckodriverArchivePath);
  const firefox = await ensureFirefox(manifest.firefox, firefoxInstallerPath);
  const geckodriver = await ensureGeckodriver(manifest.geckodriver, geckodriverArchivePath);

  const state = {
    schemaVersion: 1,
    platform: manifest.platform,
    manifest,
    paths: {
      cache: relativeLabel(CACHE_ROOT),
      firefoxBinary: relativeLabel(firefox.binaryPath),
      geckodriverBinary: relativeLabel(geckodriver.binaryPath),
    },
    verifiedAt: new Date().toISOString(),
  };
  await writeJson(STATE_PATH, state);
  console.log(
    JSON.stringify({
      command: 'firefox:setup',
      cache: relativeLabel(CACHE_ROOT),
      firefox: manifest.firefox.version,
      geckodriver: manifest.geckodriver.version,
      downloaded: firefoxDownload.downloaded || geckodriverDownload.downloaded,
      extracted: firefox.extracted || geckodriver.extracted,
    }),
  );
  return { manifest, firefox, geckodriver, cacheRoot: CACHE_ROOT };
}

function runPnpm(args, environment) {
  const npmExecPath = process.env.npm_execpath || process.env.NPM_EXECPATH;
  const command = npmExecPath
    ? process.execPath
    : process.platform === 'win32'
      ? 'pnpm.cmd'
      : 'pnpm';
  const commandArgs = npmExecPath ? [npmExecPath, ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: PRODUCT_ROOT,
    env: { ...process.env, ...environment },
    shell: !npmExecPath && process.platform === 'win32',
    stdio: 'inherit',
    windowsHide: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(' ')} exited with ${result.status ?? 'unknown status'}`);
  }
}

async function buildCurrentFirefox(toolchain) {
  runPnpm(['build:firefox'], {
    FIREFOX_BIN: toolchain.firefox.binaryPath,
    GECKODRIVER_BIN: toolchain.geckodriver.binaryPath,
  });
  const manifestPath = resolve(FIREFOX_BUILD_ROOT, 'manifest.json');
  if (!(await exists(manifestPath))) {
    throw new Error('Firefox build completed without dist/firefox-mv3/manifest.json');
  }
  return readJson(manifestPath);
}

async function ensurePersistentProfile(profilePath) {
  await mkdir(profilePath, { recursive: true });
  for (const lockName of ['parent.lock', '.parentlock', 'lock']) {
    await rm(resolve(profilePath, lockName), { force: true });
  }
  const preferencesPath = resolve(profilePath, 'prefs.js');
  if (!(await exists(preferencesPath))) {
    await writeFile(preferencesPath, '// Mozilla User Preferences\n', 'utf8');
  }
}

async function createFirefoxDriver(toolchain, profilePath, headless) {
  await ensurePersistentProfile(profilePath);
  process.env.FIREFOX_BIN = toolchain.firefox.binaryPath;
  process.env.GECKODRIVER_BIN = toolchain.geckodriver.binaryPath;

  const options = new firefox.Options()
    .setBinary(toolchain.firefox.binaryPath)
    .addArguments('-no-remote', '-profile', profilePath);
  if (headless) options.addArguments('-headless');

  return new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(firefoxService())
    .build();
}

async function runFirefoxSession({
  toolchain,
  extensionManifest,
  profileName,
  headless,
  temporary,
  holdOpen,
}) {
  const profilePath = resolve(PROFILE_ROOT, profileName);
  const driver = await createFirefoxDriver(toolchain, profilePath, headless);
  let addonId;
  try {
    addonId = await driver.installAddon(FIREFOX_BUILD_ROOT, temporary);
    const expectedAddonId = extensionManifest.browser_specific_settings?.gecko?.id;
    if (!expectedAddonId || addonId !== expectedAddonId) {
      throw new Error(
        `Firefox extension ID mismatch: expected ${expectedAddonId || 'missing'}, got ${addonId}`,
      );
    }

    const result = {
      browser: 'firefox',
      firefoxVersion: toolchain.manifest.firefox.version,
      geckodriverVersion: toolchain.manifest.geckodriver.version,
      addonId,
      extensionPage: 'not navigated; extension installed by Selenium',
      profile: relativeLabel(profilePath),
      temporary,
    };
    console.log(JSON.stringify(result));

    if (holdOpen) {
      console.log('Managed Firefox is running. Press Ctrl+C to stop it.');
      await new Promise((resolveStop) => {
        const stop = () => {
          process.off('SIGINT', stop);
          process.off('SIGTERM', stop);
          resolveStop();
        };
        process.once('SIGINT', stop);
        process.once('SIGTERM', stop);
      });
    }
    return result;
  } finally {
    await driver.quit();
    delete process.env.FIREFOX_BIN;
    delete process.env.GECKODRIVER_BIN;
  }
}

async function runDevManaged() {
  const toolchain = await setupToolchain();
  const extensionManifest = await buildCurrentFirefox(toolchain);
  await runFirefoxSession({
    toolchain,
    extensionManifest,
    profileName: 'managed-dev',
    headless: false,
    temporary: true,
    holdOpen: true,
  });
}

async function runInstallDev() {
  const toolchain = await setupToolchain();
  const extensionManifest = await buildCurrentFirefox(toolchain);
  await runFirefoxSession({
    toolchain,
    extensionManifest,
    profileName: 'dev-install',
    headless: true,
    temporary: true,
    holdOpen: false,
  });
}

async function runM1Test() {
  const toolchain = await setupToolchain();
  const extensionManifest = await buildCurrentFirefox(toolchain);
  await runFirefoxSession({
    toolchain,
    extensionManifest,
    profileName: 'm1-test',
    headless: true,
    temporary: true,
    holdOpen: false,
  });
}

async function listFiles(directory, prefix = '') {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = resolve(directory, entry.name);
    const entryName = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath, entryName)));
    } else if (entry.isFile()) {
      files.push(entryName.replaceAll('\\', '/'));
    }
  }
  return files.sort();
}

function gitOutput(args) {
  return execFileSync('git', args, {
    cwd: PRODUCT_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

function assertCleanSource() {
  const status = gitOutput(['status', '--porcelain']);
  if (status) {
    throw new Error(
      'package:firefox requires a clean source worktree before creating an exact-Head artifact',
    );
  }
}

async function buildPayloadEntries(payloadRoot) {
  const payloadFiles = await listFiles(payloadRoot);
  const entries = [];
  for (const file of payloadFiles) {
    const filePath = resolve(payloadRoot, file);
    const fileStat = await stat(filePath);
    entries.push({
      path: `extension/${file}`,
      size: fileStat.size,
      sha256: await sha256File(filePath),
    });
  }
  return entries;
}

function sha256SumsText(entries) {
  return `${entries.map(({ sha256, path }) => `${sha256}  ${path}`).join('\n')}\n`;
}

async function verifyPackageOutput({ outputDir, manifest, archivePath, manifestPath, sumsPath }) {
  const actualArchiveHash = await sha256File(archivePath);
  const manifestHash = await sha256File(manifestPath);
  const sums = await readFile(sumsPath, 'utf8');
  const expected = new Map(
    sums
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [sha256, ...pathParts] = line.split(/\s{2,}/u);
        return [pathParts.join('  '), sha256];
      }),
  );
  const checks = {
    exactHead: manifest.exactHead === gitOutput(['rev-parse', 'HEAD']),
    archiveHash: actualArchiveHash === manifest.archive.sha256,
    manifestInSha256Sums: expected.get('manifest.json') === manifestHash,
    archiveInSha256Sums: expected.get(manifest.archive.file) === actualArchiveHash,
    payloadHashes: true,
  };
  for (const entry of manifest.payload.files) {
    const actual = await sha256File(resolve(outputDir, entry.path));
    if (actual !== entry.sha256 || expected.get(entry.path) !== actual)
      checks.payloadHashes = false;
  }
  return { checks, manifestHash, archiveHash: actualArchiveHash };
}

async function runPackage() {
  assertCleanSource();
  const startingHead = gitOutput(['rev-parse', 'HEAD']);
  const toolchain = await setupToolchain();
  const extensionManifest = await buildCurrentFirefox(toolchain);
  const endingHead = gitOutput(['rev-parse', 'HEAD']);
  if (startingHead !== endingHead)
    throw new Error('Source HEAD changed while building the Firefox package');

  const outputDir = resolve(PACKAGE_ROOT, endingHead);
  await mkdir(PACKAGE_ROOT, { recursive: true });
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  const payloadRoot = resolve(outputDir, 'extension');
  await cp(FIREFOX_BUILD_ROOT, payloadRoot, { recursive: true });

  const archiveName = `zeroomega-nex-firefox-m1-${endingHead}.zip`;
  const archivePath = resolve(outputDir, archiveName);
  execFileSync('tar.exe', ['-a', '-c', '-f', archivePath, '-C', outputDir, 'extension'], {
    cwd: PRODUCT_ROOT,
    stdio: 'inherit',
    windowsHide: true,
  });

  const payloadFiles = await buildPayloadEntries(payloadRoot);
  const archiveStat = await stat(archivePath);
  const manifest = {
    schemaVersion: 1,
    package: 'firefox-m1',
    browser: 'firefox',
    exactHead: endingHead,
    source: {
      buildDirectory: 'dist/firefox-mv3',
      extensionId: extensionManifest.browser_specific_settings?.gecko?.id || null,
    },
    toolchain: {
      platform: toolchain.manifest.platform,
      firefox: toolchain.manifest.firefox,
      geckodriver: toolchain.manifest.geckodriver,
    },
    archive: {
      file: archiveName,
      size: archiveStat.size,
      sha256: await sha256File(archivePath),
    },
    payload: {
      root: 'extension',
      files: payloadFiles,
    },
    generatedAt: new Date().toISOString(),
  };
  const manifestPath = resolve(outputDir, 'manifest.json');
  await writeJson(manifestPath, manifest);
  const manifestHash = await sha256File(manifestPath);
  const sumsPath = resolve(outputDir, 'SHA256SUMS');
  await writeFile(
    sumsPath,
    sha256SumsText([
      { path: archiveName, sha256: manifest.archive.sha256 },
      { path: 'manifest.json', sha256: manifestHash },
      ...payloadFiles,
    ]),
    'utf8',
  );

  const verificationPath = resolve(outputDir, 'verification-report.json');
  const verification = await verifyPackageOutput({
    outputDir,
    manifest,
    archivePath,
    manifestPath,
    sumsPath,
  });
  const passed = Object.values(verification.checks).every(Boolean);
  const report = {
    schemaVersion: 1,
    verification: passed ? 'passed' : 'failed',
    exactHead: endingHead,
    checks: verification.checks,
    artifacts: {
      archive: { file: archiveName, sha256: verification.archiveHash },
      manifest: { file: 'manifest.json', sha256: verification.manifestHash },
      sha256Sums: { file: 'SHA256SUMS', sha256: await sha256File(sumsPath) },
    },
    verifiedAt: new Date().toISOString(),
  };
  await writeJson(verificationPath, report);
  await writeFile(
    resolve(outputDir, 'verification-report.sha256'),
    `${await sha256File(verificationPath)}  verification-report.json\n`,
    'utf8',
  );
  if (!passed)
    throw new Error('Firefox package verification failed; inspect the ignored verification report');

  console.log(
    JSON.stringify({
      command: 'package:firefox',
      exactHead: endingHead,
      output: relativeLabel(outputDir),
      archive: archiveName,
      verification: report.verification,
    }),
  );
}

function printHelp() {
  console.log(
    [
      'Usage: node scripts/firefox-toolchain.mjs <command>',
      'Commands: setup, dev-managed, install-dev, test-m1, package',
    ].join('\n'),
  );
}

async function main() {
  switch (process.argv[2]) {
    case 'setup':
      await setupToolchain();
      break;
    case 'dev-managed':
      await runDevManaged();
      break;
    case 'install-dev':
      await runInstallDev();
      break;
    case 'test-m1':
      await runM1Test();
      break;
    case 'package':
      await runPackage();
      break;
    default:
      printHelp();
      if (process.argv[2]) process.exitCode = 1;
  }
}

const currentScript = process.argv[1] ? resolve(process.argv[1]) : '';
if (currentScript === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(
      `Firefox M1 command failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  });
}
