import { readFile, writeFile } from 'node:fs/promises';

function insertOnce(text, anchor, insertion, label) {
  if (!text.includes(anchor)) throw new Error(`${label} anchor missing`);
  return text.replace(anchor, insertion);
}

async function patchChromium() {
  const path = 'scripts/e2e-chromium-original-large-migration.mjs';
  let text = await readFile(path, 'utf8');
  text = insertOnce(
    text,
    "const userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-original-large-migration-'));",
    "const invalidBackupPath = resolve('fixtures/zeroomega-v2/invalid/missing-reference.json');\nconst userDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-original-large-migration-'));",
    'Chromium invalid backup',
  );

  const helpers = `async function workflowStorageSnapshot(options) {
  return options.evaluate(async (namespace) => {
    const all = await chrome.storage.local.get(null);
    return Object.fromEntries(
      Object.entries(all).filter(([key]) => key.startsWith(namespace)),
    );
  }, workflowStorageNamespace);
}

async function analyzeRejectedBackupWithoutMutation(options, path) {
  const before = await workflowStorageSnapshot(options);
  await options.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await options.getByLabel('原版备份文件').setInputFiles(path);
  const review = options.locator('[data-legacy-import-review]');
  await review.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await review.locator('[data-legacy-import-and-use]').count(),
    0,
    'Rejected legacy backup unexpectedly exposed Import & Use',
  );
  await review.getByRole('alert').waitFor({ state: 'visible', timeout: 20_000 });
  const rejectedCount = Number(
    await review.locator('[data-legacy-status="rejected"] strong').innerText(),
  );
  assert.equal(rejectedCount > 0, true, 'Rejected legacy backup did not report a blocking item');
  const after = await workflowStorageSnapshot(options);
  assert.deepEqual(after, before, 'Rejected legacy analysis mutated workflow persistence');
  return { rejectedCount };
}

async function injectInterruptedApply(options) {
  return options.evaluate(async ({ namespace }) => {
    const stateKey = `${namespace}/state`;
    const values = await chrome.storage.local.get(stateKey);
    const state = values[stateKey];
    if (!state) throw new Error('workflow state is unavailable for interrupted Apply injection');
    const draft = structuredClone(state.draft);
    if (!draft.profiles?.[0]) throw new Error('workflow Draft has no profile to edit');
    draft.profiles[0].name = `${draft.profiles[0].name} [interrupted draft]`;
    const candidate = structuredClone(draft);
    candidate.revision = {
      id: 'revision-e2e-interrupted-apply',
      parentId: state.applied.revision.id,
      createdAt: '2026-08-07T08:30:00.000Z',
      deviceId: 'device-e2e-interrupted-apply',
    };
    const interrupted = {
      ...state,
      generation: state.generation + 1,
      draft,
      pendingApply: {
        applyId: 'apply-e2e-interrupted-commit',
        candidate,
        previousAppliedRevisionId: state.applied.revision.id,
        startedAt: '2026-08-07T08:30:00.000Z',
        phase: 'committing',
      },
    };
    await chrome.storage.local.set({ [stateKey]: interrupted });
    await chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' });
    const platform = await chrome.proxy.settings.get({ incognito: false });
    return {
      appliedRevisionId: state.applied.revision.id,
      injectedGeneration: interrupted.generation,
      draftName: draft.profiles[0].name,
      platformMode: platform.value?.mode,
    };
  }, { namespace: workflowStorageNamespace });
}

async function assertInterruptedApplyRecovered(options, injected) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(options, { action: 'get' }),
    'Interrupted Apply recovery did not expose a usable workflow',
  );
  assert.equal(current.state.applied.revision.id, injected.appliedRevisionId);
  assert.equal(current.state.pendingApply, undefined);
  assert.equal(current.view.busy, false);
  assert.equal(current.view.dirty, true);
  assert.equal(current.state.draft.profiles[0]?.name, injected.draftName);
  assert.equal(current.state.lastApply?.status, 'failed');
  assert.equal(current.state.lastApply?.stage, 'recovery');
  assert.equal(current.state.lastApply?.rollbackSucceeded, true);
  assert.equal(current.state.generation > injected.injectedGeneration, true);
  return current;
}

let context;`;
  text = insertOnce(text, 'let context;', helpers, 'Chromium failure helpers');

  const mainAnchor = "  await assertRouteDecisions(context, 'after-reimport-analysis');\n\n  console.log(";
  const mainInsertion = `  await assertRouteDecisions(context, 'after-reimport-analysis');

  const rejectedImport = await analyzeRejectedBackupWithoutMutation(options, invalidBackupPath);
  await waitForActiveSwitch(
    options,
    beforeReimport.switchId,
    'Rejected legacy analysis changed the confirmed Chromium PAC route',
  );
  await assertRouteDecisions(context, 'after-rejected-import-analysis');

  const interrupted = await injectInterruptedApply(options);
  assert.equal(interrupted.platformMode, 'direct');
  await context.close();
  context = undefined;

  context = await launch();
  ({ options } = await extensionSurface(context));
  const recoveredInterruptedApply = await assertInterruptedApplyRecovered(options, interrupted);
  await waitForActiveSwitch(
    options,
    beforeReimport.switchId,
    'Interrupted Apply restart recovery did not restore the previous Chromium PAC route',
  );
  await assertRouteDecisions(context, 'after-interrupted-apply-recovery');

  console.log(`;
  text = insertOnce(text, mainAnchor, mainInsertion, 'Chromium main failure path');

  const metricsAnchor = "        semanticExport: exported,\n      },";
  const metricsInsertion = `        semanticExport: exported,
        failurePreservation: {
          rejectedImport,
          interruptedApply: {
            injected,
            recoveredGeneration: recoveredInterruptedApply.state.generation,
            lastApply: recoveredInterruptedApply.state.lastApply,
          },
        },
      },`;
  text = insertOnce(text, metricsAnchor, metricsInsertion, 'Chromium metrics');
  text = text.replace(
    'Chromium original large import, acceptance, Apply, restart, semantic export, and reimport passed.',
    'Chromium original large migration plus rejected-import and interrupted-Apply preservation passed.',
  );
  await writeFile(path, text);
}

async function patchFirefox() {
  const path = 'scripts/e2e-firefox-original-large-migration.mjs';
  let text = await readFile(path, 'utf8');
  text = insertOnce(
    text,
    "const profileDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-firefox-large-migration-'));",
    "const invalidBackupPath = resolve('fixtures/zeroomega-v2/invalid/missing-reference.json');\nconst profileDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-firefox-large-migration-'));",
    'Firefox invalid backup',
  );

  const helpers = `async function workflowStorageSnapshot(driver) {
  return driver.executeAsyncScript(
    \`
      const namespace = arguments[0];
      const done = arguments[1];
      browser.storage.local.get(null).then((all) => {
        done(Object.fromEntries(Object.entries(all).filter(([key]) => key.startsWith(namespace))));
      }, (error) => done({ error: String(error) }));
    \`,
    workflowStorageNamespace,
  );
}

async function analyzeRejectedBackupWithoutMutation(driver, path) {
  const before = await workflowStorageSnapshot(driver);
  const importExportButton = await driver.findElement(
    By.xpath("//button[.//*[@data-options-nav-icon='import']]"),
  );
  await importExportButton.click();
  const fileInput = await driver.wait(until.elementLocated(By.css('input[type="file"]')), 20_000);
  await fileInput.sendKeys(path);
  const review = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(review), 20_000);
  assert.equal(
    (await driver.findElements(By.css('[data-legacy-import-review] [data-legacy-import-and-use]')))
      .length,
    0,
    'Rejected legacy backup unexpectedly exposed Import & Use in Firefox',
  );
  const alert = await driver.wait(
    until.elementLocated(By.css('[data-legacy-import-review] [role="alert"]')),
    20_000,
  );
  await driver.wait(until.elementIsVisible(alert), 20_000);
  const rejectedText = await driver
    .findElement(By.css('[data-legacy-import-review] [data-legacy-status="rejected"] strong'))
    .getText();
  const rejectedCount = Number(rejectedText);
  assert.equal(rejectedCount > 0, true, 'Firefox rejected import did not report a blocking item');
  const after = await workflowStorageSnapshot(driver);
  assert.deepEqual(after, before, 'Firefox rejected legacy analysis mutated workflow persistence');
  return { rejectedCount };
}

async function injectInterruptedApply(driver) {
  return driver.executeAsyncScript(
    \`
      const namespace = arguments[0];
      const done = arguments[1];
      (async () => {
        const stateKey = namespace + '/state';
        const values = await browser.storage.local.get(stateKey);
        const state = values[stateKey];
        if (!state) throw new Error('workflow state is unavailable for interrupted Apply injection');
        const draft = structuredClone(state.draft);
        if (!draft.profiles?.[0]) throw new Error('workflow Draft has no profile to edit');
        draft.profiles[0].name = draft.profiles[0].name + ' [interrupted draft]';
        const candidate = structuredClone(draft);
        candidate.revision = {
          id: 'revision-e2e-interrupted-apply',
          parentId: state.applied.revision.id,
          createdAt: '2026-08-07T08:30:00.000Z',
          deviceId: 'device-e2e-interrupted-apply',
        };
        const interrupted = {
          ...state,
          generation: state.generation + 1,
          draft,
          pendingApply: {
            applyId: 'apply-e2e-interrupted-commit',
            candidate,
            previousAppliedRevisionId: state.applied.revision.id,
            startedAt: '2026-08-07T08:30:00.000Z',
            phase: 'committing',
          },
        };
        await browser.storage.local.set({ [stateKey]: interrupted });
        await browser.proxy.settings.set({ value: { proxyType: 'none' } });
        const platform = await browser.proxy.settings.get({});
        return {
          appliedRevisionId: state.applied.revision.id,
          injectedGeneration: interrupted.generation,
          draftName: draft.profiles[0].name,
          platformMode: platform.value?.proxyType,
        };
      })().then(done, (error) => done({ error: String(error) }));
    \`,
    workflowStorageNamespace,
  );
}

async function assertInterruptedApplyRecovered(driver, injected) {
  const current = assertWorkflowSuccess(
    await sendWorkflowCommand(driver, { action: 'get' }),
    'Firefox interrupted Apply recovery did not expose a usable workflow',
  );
  assert.equal(current.state.applied.revision.id, injected.appliedRevisionId);
  assert.equal(current.state.pendingApply, undefined);
  assert.equal(current.view.busy, false);
  assert.equal(current.view.dirty, true);
  assert.equal(current.state.draft.profiles[0]?.name, injected.draftName);
  assert.equal(current.state.lastApply?.status, 'failed');
  assert.equal(current.state.lastApply?.stage, 'recovery');
  assert.equal(current.state.lastApply?.rollbackSucceeded, true);
  assert.equal(current.state.generation > injected.injectedGeneration, true);
  return current;
}

let driver;`;
  text = insertOnce(text, 'let driver;', helpers, 'Firefox failure helpers');

  const mainAnchor = "  await assertRouteDecisions(driver, optionsWindow, 'after-reimport-analysis');\n\n  console.log(";
  const mainInsertion = `  await assertRouteDecisions(driver, optionsWindow, 'after-reimport-analysis');

  const rejectedImport = await analyzeRejectedBackupWithoutMutation(driver, invalidBackupPath);
  await waitForActiveSwitch(
    driver,
    beforeReimport.switchId,
    'Rejected legacy analysis changed the confirmed Firefox PAC route',
  );
  await assertRouteDecisions(driver, optionsWindow, 'after-rejected-import-analysis');

  const interrupted = await injectInterruptedApply(driver);
  assert.equal(interrupted.platformMode, 'none');
  await driver.quit();
  driver = undefined;

  driver = await launch();
  await installExtension(driver);
  optionsWindow = await navigateOptions(driver);
  const recoveredInterruptedApply = await assertInterruptedApplyRecovered(driver, interrupted);
  await waitForActiveSwitch(
    driver,
    beforeReimport.switchId,
    'Interrupted Apply restart recovery did not restore the previous Firefox PAC route',
  );
  await assertRouteDecisions(driver, optionsWindow, 'after-interrupted-apply-recovery');

  console.log(`;
  text = insertOnce(text, mainAnchor, mainInsertion, 'Firefox main failure path');

  const metricsAnchor = "        semanticExport: exported,\n      },";
  const metricsInsertion = `        semanticExport: exported,
        failurePreservation: {
          rejectedImport,
          interruptedApply: {
            injected,
            recoveredGeneration: recoveredInterruptedApply.state.generation,
            lastApply: recoveredInterruptedApply.state.lastApply,
          },
        },
      },`;
  text = insertOnce(text, metricsAnchor, metricsInsertion, 'Firefox metrics');
  text = text.replace(
    'Firefox original large import, acceptance, Apply, restart, semantic export, and reimport passed.',
    'Firefox original large migration plus rejected-import and interrupted-Apply preservation passed.',
  );
  await writeFile(path, text);
}

await Promise.all([patchChromium(), patchFirefox()]);
