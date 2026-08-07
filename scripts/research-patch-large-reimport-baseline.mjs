import { readFile, writeFile } from 'node:fs/promises';

async function patchChromium() {
  const path = 'scripts/e2e-chromium-original-large-migration.mjs';
  let text = await readFile(path, 'utf8');
  const oldBlock = `  const exported = await exportOriginalSemantics(options, originalOptions);\n  await reimportForReview(options, reimportPath);\n  const reimported = await assertLargeState(options, 'after semantic re-import analysis');\n  assert.equal(reimported.switchId, restored.switchId);\n  assert.deepEqual(reimported.metrics, restored.metrics);\n  await waitForActiveSwitch(\n    options,\n    restored.switchId,\n    'Semantic re-import analysis changed the confirmed Chromium PAC route',\n  );\n  await assertRouteDecisions(context, 'after-reimport-analysis');\n`;
  const newBlock = `  const exported = await exportOriginalSemantics(options, originalOptions);\n  const beforeReimport = await assertLargeState(\n    options,\n    'after semantic export / before re-import analysis',\n  );\n  await reimportForReview(options, reimportPath);\n  const reimported = await assertLargeState(options, 'after semantic re-import analysis');\n  assert.equal(reimported.switchId, beforeReimport.switchId);\n  assert.deepEqual(reimported.metrics, beforeReimport.metrics);\n  await waitForActiveSwitch(\n    options,\n    beforeReimport.switchId,\n    'Semantic re-import analysis changed the confirmed Chromium PAC route',\n  );\n  await assertRouteDecisions(context, 'after-reimport-analysis');\n`;
  if (!text.includes(oldBlock)) throw new Error('Chromium re-import block not found');
  text = text.replace(oldBlock, newBlock);
  const oldMetrics = `          afterImport: imported.metrics,\n          afterRestart: restored.metrics,\n          afterReimportAnalysis: reimported.metrics,\n`;
  const newMetrics = `          afterImport: imported.metrics,\n          afterRestart: restored.metrics,\n          afterExportBeforeReimport: beforeReimport.metrics,\n          afterReimportAnalysis: reimported.metrics,\n`;
  if (!text.includes(oldMetrics)) throw new Error('Chromium metrics block not found');
  await writeFile(path, text.replace(oldMetrics, newMetrics));
}

async function patchFirefox() {
  const path = 'scripts/e2e-firefox-original-large-migration.mjs';
  let text = await readFile(path, 'utf8');
  const oldBlock = `  const exported = await exportOriginalSemantics(driver, originalOptions);\n  await reimportForReview(driver, reimportPath);\n  const reimported = await assertLargeState(driver, 'after semantic re-import analysis');\n  assert.equal(reimported.switchId, restored.switchId);\n  assert.deepEqual(reimported.metrics, restored.metrics);\n  await waitForActiveSwitch(\n    driver,\n    restored.switchId,\n    'Semantic re-import analysis changed the confirmed Firefox PAC route',\n  );\n  await assertRouteDecisions(driver, optionsWindow, 'after-reimport-analysis');\n`;
  const newBlock = `  const exported = await exportOriginalSemantics(driver, originalOptions);\n  const beforeReimport = await assertLargeState(\n    driver,\n    'after semantic export / before re-import analysis',\n  );\n  await reimportForReview(driver, reimportPath);\n  const reimported = await assertLargeState(driver, 'after semantic re-import analysis');\n  assert.equal(reimported.switchId, beforeReimport.switchId);\n  assert.deepEqual(reimported.metrics, beforeReimport.metrics);\n  await waitForActiveSwitch(\n    driver,\n    beforeReimport.switchId,\n    'Semantic re-import analysis changed the confirmed Firefox PAC route',\n  );\n  await assertRouteDecisions(driver, optionsWindow, 'after-reimport-analysis');\n`;
  if (!text.includes(oldBlock)) throw new Error('Firefox re-import block not found');
  text = text.replace(oldBlock, newBlock);
  const oldMetrics = `          afterImport: imported.metrics,\n          afterRestart: restored.metrics,\n          afterReimportAnalysis: reimported.metrics,\n`;
  const newMetrics = `          afterImport: imported.metrics,\n          afterRestart: restored.metrics,\n          afterExportBeforeReimport: beforeReimport.metrics,\n          afterReimportAnalysis: reimported.metrics,\n`;
  if (!text.includes(oldMetrics)) throw new Error('Firefox metrics block not found');
  await writeFile(path, text.replace(oldMetrics, newMetrics));
}

await Promise.all([patchChromium(), patchFirefox()]);
