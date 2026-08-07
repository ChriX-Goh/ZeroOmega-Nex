import { readFile, writeFile } from 'node:fs/promises';

async function patch(path, transforms) {
  let text = await readFile(path, 'utf8');
  for (const [needle, replacement] of transforms) {
    if (!text.includes(needle)) throw new Error(`${path}: anchor missing: ${needle.slice(0, 80)}`);
    text = text.replace(needle, replacement);
  }
  await writeFile(path, text);
}

const helperImport = `import {\n  appendMig01Evidence,\n  assertNoSecretMarkers,\n  semanticSha256,\n  sha256Text,\n} from './mig01-semantic-evidence.mjs';\n`;

await patch('scripts/e2e-chromium-original-migration.mjs', [
  ["import { chromium } from '@playwright/test';\n", "import { chromium } from '@playwright/test';\n\n" + helperImport],
  [
`  assert.doesNotMatch(\n    exportedContent,\n    /passwordSecretRef|secretRef|not-a-real-secret/u,\n    'Original migration export leaked secret references',\n  );\n}\n\nlet context;`,
`  assert.doesNotMatch(\n    exportedContent,\n    /passwordSecretRef|secretRef|not-a-real-secret/u,\n    'Original migration export leaked secret references',\n  );\n  assertNoSecretMarkers(exportedContent, 'Chromium original semantic export');\n  return {\n    exportedPath,\n    bytes: Buffer.byteLength(exportedContent, 'utf8'),\n    sha256: sha256Text(exportedContent),\n    semanticSha256: semanticSha256(requiredOriginalSemantics(exportedOptions)),\n  };\n}\n\nasync function workflowStorageSnapshot(options) {\n  return options.evaluate(async () => {\n    const all = await chrome.storage.local.get(null);\n    return Object.fromEntries(\n      Object.entries(all).filter(([key]) => key.startsWith('zeroomega-nex/profile-workflow/v1')),\n    );\n  });\n}\n\nasync function reimportForReview(options, path) {\n  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();\n  await options.getByLabel('原版备份文件').setInputFiles(path);\n  const review = options.locator('[data-legacy-import-review]');\n  await review.waitFor({ state: 'visible', timeout: 60_000 });\n  assertNoSecretMarkers(await review.innerText(), 'Chromium semantic re-import review');\n  assert.equal(\n    await review.locator('[data-legacy-import-and-use]').isEnabled(),\n    true,\n    'Chromium semantic re-import was not accepted',\n  );\n}\n\nlet context;`],
  [
`  await exportOriginalSemantics(options, originalOptions);\n\n  console.log(`,
`  const exported = await exportOriginalSemantics(options, originalOptions);\n  const beforeReimport = await workflowStorageSnapshot(options);\n  await reimportForReview(options, exported.exportedPath);\n  const afterReimport = await workflowStorageSnapshot(options);\n  assert.deepEqual(afterReimport, beforeReimport, 'Chromium semantic re-import review mutated workflow persistence');\n  await appendMig01Evidence({\n    kind: 'semantic',\n    browser: 'chromium',\n    corpus: complexCorpus ? 'C/D' : 'A',\n    bytes: exported.bytes,\n    sha256: exported.sha256,\n    semanticSha256: exported.semanticSha256,\n    reimportAccepted: true,\n    persistentMutation: false,\n    secretScanClean: true,\n  });\n\n  console.log(`],
]);

await patch('scripts/e2e-firefox-original-migration.mjs', [
  ["import firefox from 'selenium-webdriver/firefox.js';\n", "import firefox from 'selenium-webdriver/firefox.js';\n\n" + helperImport],
  [
`  assert.doesNotMatch(\n    exportedContent,\n    /passwordSecretRef|secretRef|not-a-real-secret/u,\n    'Firefox original migration export leaked secret references',\n  );\n}\n\nasync function importOriginalBackup(driver) {`,
`  assert.doesNotMatch(\n    exportedContent,\n    /passwordSecretRef|secretRef|not-a-real-secret/u,\n    'Firefox original migration export leaked secret references',\n  );\n  assertNoSecretMarkers(exportedContent, 'Firefox original semantic export');\n  return {\n    exportedPath,\n    bytes: Buffer.byteLength(exportedContent, 'utf8'),\n    sha256: sha256Text(exportedContent),\n    semanticSha256: semanticSha256(requiredOriginalSemantics(exportedOptions)),\n  };\n}\n\nasync function workflowStorageSnapshot(driver) {\n  return driver.executeAsyncScript(\n    \`\n      const done = arguments[0];\n      browser.storage.local.get(null).then((all) => {\n        done(Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith('zeroomega-nex/profile-workflow/v1'))));\n      }, (error) => done({ error: String(error) }));\n    \`,\n  );\n}\n\nasync function reimportForReview(driver, path) {\n  const importExportButton = await driver.findElement(By.xpath(\"//button[.//*[@data-options-nav-icon='import']]\"));\n  await importExportButton.click();\n  const fileInput = await driver.wait(until.elementLocated(By.css('input[type=\"file\"]')), 60_000);\n  await fileInput.sendKeys(path);\n  const review = await driver.wait(until.elementLocated(By.css('[data-legacy-import-review]')), 60_000);\n  await driver.wait(until.elementIsVisible(review), 60_000);\n  assertNoSecretMarkers(await review.getText(), 'Firefox semantic re-import review');\n  const importButton = await driver.wait(until.elementLocated(By.css('[data-legacy-import-and-use]')), 60_000);\n  assert.equal(await importButton.isEnabled(), true, 'Firefox semantic re-import was not accepted');\n}\n\nasync function importOriginalBackup(driver) {`],
  [
`  await exportOriginalSemantics(driver, originalOptions);\n\n  console.log(`,
`  const exported = await exportOriginalSemantics(driver, originalOptions);\n  const beforeReimport = await workflowStorageSnapshot(driver);\n  await reimportForReview(driver, exported.exportedPath);\n  const afterReimport = await workflowStorageSnapshot(driver);\n  assert.deepEqual(afterReimport, beforeReimport, 'Firefox semantic re-import review mutated workflow persistence');\n  await appendMig01Evidence({\n    kind: 'semantic',\n    browser: 'firefox',\n    corpus: complexCorpus ? 'C/D' : 'A',\n    bytes: exported.bytes,\n    sha256: exported.sha256,\n    semanticSha256: exported.semanticSha256,\n    reimportAccepted: true,\n    persistentMutation: false,\n    secretScanClean: true,\n  });\n\n  console.log(`],
]);

for (const [path, browser] of [
  ['scripts/e2e-chromium-original-large-migration.mjs', 'chromium'],
  ['scripts/e2e-firefox-original-large-migration.mjs', 'firefox'],
]) {
  const browserAnchor = browser === 'chromium' ? "import { chromium } from '@playwright/test';\n" : "import firefox from 'selenium-webdriver/firefox.js';\n";
  await patch(path, [
    [browserAnchor, browserAnchor + '\n' + helperImport],
    [
`    sha256: createHash('sha256').update(exportedContent).digest('hex'),\n  };`,
`    sha256: createHash('sha256').update(exportedContent).digest('hex'),\n    semanticSha256: semanticSha256(requiredLargeSemantics(exportedOptions)),\n  };`],
    [
`  await reimportForReview(${browser === 'chromium' ? 'options' : 'driver'}, reimportPath);`,
`  const beforeReimportStorage = await workflowStorageSnapshot(${browser === 'chromium' ? 'options' : 'driver'});\n  await reimportForReview(${browser === 'chromium' ? 'options' : 'driver'}, reimportPath);`],
    [
`  assert.deepEqual(reimported.metrics, beforeReimport.metrics);`,
`  assert.deepEqual(reimported.metrics, beforeReimport.metrics);\n  const afterReimportStorage = await workflowStorageSnapshot(${browser === 'chromium' ? 'options' : 'driver'});\n  assert.deepEqual(afterReimportStorage, beforeReimportStorage, '${browser} large semantic re-import review mutated workflow persistence');\n  await appendMig01Evidence({\n    kind: 'semantic',\n    browser: '${browser}',\n    corpus: 'large',\n    bytes: exported.bytes,\n    sha256: exported.sha256,\n    semanticSha256: exported.semanticSha256,\n    reimportAccepted: true,\n    persistentMutation: false,\n    secretScanClean: true,\n  });`],
  ]);
}
