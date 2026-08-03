from pathlib import Path
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


capture_path = 'scripts/capture-original-nex-ui-evidence.mjs'
evidence_path = 'docs/AUDIT_EVIDENCE_02N_EXPANDED_POPUP_STATES.md'

replace_once(
    capture_path,
    """async function availableLocales(extensionPath) {
  const entries = await readdir(resolve(extensionPath, '_locales'), { withFileTypes: true }).catch(
    () => [],
  );
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function extensionPages(manifest) {""",
    """async function availableLocales(extensionPath) {
  const entries = await readdir(resolve(extensionPath, '_locales'), { withFileTypes: true }).catch(
    () => [],
  );
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function pause(delay = 100) {
  await new Promise((resolvePause) => setTimeout(resolvePause, delay));
}

function extensionPages(manifest) {""",
)

replace_once(
    capture_path,
    """        options: '#js-option',
        optionsIcon: '#js-option > .glyphicon:first-child',""",
    """        options: '#js-option',
        optionsIcon: '#js-option > .glyphicon:first-child',
        resultControl: 'select',""",
)
replace_once(
    capture_path,
    """        options: '.settings-button',
        optionsIcon:
          '[data-original-popup-icon="wrench"][data-original-popup-icon-position="options"]',""",
    """        options: '.settings-button',
        optionsIcon:
          '[data-original-popup-icon="wrench"][data-original-popup-icon-position="options"]',
        resultControl: '.profile-result-select',""",
)

replace_once(
    capture_path,
    """async function captureImplementation(implementation, extensionPath, entries) {""",
    """async function sendOriginalRuntimeMessage(page, method, args = []) {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return await page.evaluate(
        async ({ requestMethod, requestArgs }) =>
          new Promise((resolveMessage, rejectMessage) => {
            chrome.runtime.sendMessage(
              { method: requestMethod, args: requestArgs },
              (response) => {
                if (chrome.runtime.lastError) {
                  rejectMessage(new Error(chrome.runtime.lastError.message));
                  return;
                }
                if (response?.error) {
                  rejectMessage(new Error(String(response.error.message ?? response.error)));
                  return;
                }
                resolveMessage(response?.result ?? null);
              },
            );
          }),
        { requestMethod: method, requestArgs: args },
      );
    } catch (error) {
      lastError = error;
      await pause();
    }
  }
  throw lastError ?? new Error(`Original runtime message ${method} failed`);
}

async function activateOriginalEvidenceProfile(page, profileName) {
  await sendOriginalRuntimeMessage(page, 'applyProfile', [profileName]);
  let latest;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    latest = await sendOriginalRuntimeMessage(page, 'getState', [
      { currentProfileName: '', isSystemProfile: false, validResultProfiles: [] },
    ]);
    if (latest?.currentProfileName === profileName) return latest;
    await pause();
  }
  throw new Error(`Original profile did not become ${profileName}: ${JSON.stringify(latest)}`);
}

async function sendNexRuntimeMessage(page, message) {
  const response = await page.evaluate(
    async (request) => chrome.runtime.sendMessage(request),
    message,
  );
  assert.equal(response?.ok, true, `Nex runtime command failed: ${JSON.stringify(response)}`);
  return response;
}

async function activateNexEvidenceProfile(page, profileName) {
  const channel = 'zeroomega-nex/profile-workflow/v1';
  const current = await sendNexRuntimeMessage(page, { channel, action: 'get' });
  const profile = current.state.applied.profiles.find(
    (candidate) => candidate.name === profileName,
  );
  assert.ok(profile, `Nex profile ${profileName} was not found`);
  await sendNexRuntimeMessage(page, {
    channel,
    action: 'activate-route',
    expectedAppliedRevisionId: current.state.applied.revision.id,
    route: { kind: 'profile', profileId: profile.id },
  });
  let latest;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    latest = await sendNexRuntimeMessage(page, { channel, action: 'get' });
    if (
      latest.runtime?.activeRoute?.kind === 'profile' &&
      latest.runtime.activeRoute.profileId === profile.id
    ) {
      return latest;
    }
    await pause();
  }
  throw new Error(`Nex profile did not become ${profileName}: ${JSON.stringify(latest)}`);
}

async function activateEvidenceProfile(page, implementation, profileName) {
  return implementation === 'original-v3.5.0'
    ? activateOriginalEvidenceProfile(page, profileName)
    : activateNexEvidenceProfile(page, profileName);
}

async function capturePopupState(
  context,
  baseUrl,
  popupPath,
  implementation,
  surface,
  outputDir,
  entries,
) {
  const popup = await context.newPage();
  try {
    await popup.setViewportSize({ width: 440, height: 760 });
    await popup.goto(`${baseUrl}/${popupPath.replace(/^\\//u, '')}`);
    await captureSurface(popup, implementation, surface, popupPath, outputDir, entries);
  } finally {
    await popup.close();
  }
}

async function captureImplementation(implementation, extensionPath, entries) {""",
)

replace_once(
    capture_path,
    """    const popup = await context.newPage();
    await popup.setViewportSize({ width: 440, height: 760 });
    await popup.goto(`${baseUrl}/${popupPath.replace(/^\\//u, '')}`);
    await captureSurface(popup, implementation, 'popup-default', popupPath, outputDir, entries);
    await popup.close();

    const options = await context.newPage();
    await options.setViewportSize({ width: 1440, height: 1000 });
    await options.goto(`${baseUrl}/${optionsPath.replace(/^\\//u, '')}`);
    await captureSurface(
      options,
      implementation,
      'options-default',
      optionsPath,
      outputDir,
      entries,
    );
    await options.close();
    await ordinaryTab.close();""",
    """    await capturePopupState(
      context,
      baseUrl,
      popupPath,
      implementation,
      'popup-default',
      outputDir,
      entries,
    );

    const options = await context.newPage();
    await options.setViewportSize({ width: 1440, height: 1000 });
    await options.goto(`${baseUrl}/${optionsPath.replace(/^\\//u, '')}`);
    await captureSurface(
      options,
      implementation,
      'options-default',
      optionsPath,
      outputDir,
      entries,
    );

    for (const state of [
      { profileName: 'proxy', surface: 'popup-fixed-active' },
      { profileName: 'auto switch', surface: 'popup-switch-active' },
    ]) {
      await activateEvidenceProfile(options, implementation, state.profileName);
      await capturePopupState(
        context,
        baseUrl,
        popupPath,
        implementation,
        state.surface,
        outputDir,
        entries,
      );
    }

    await options.close();
    await ordinaryTab.close();""",
)

replace_once(
    capture_path,
    """assert.equal(entries.length, 4, 'paired UI evidence count');
for (const implementation of ['original-v3.5.0', 'nex']) {
  for (const surface of ['popup-default', 'options-default']) {""",
    """const pairedSurfaces = [
  'popup-default',
  'popup-fixed-active',
  'popup-switch-active',
  'options-default',
];
assert.equal(entries.length, 8, 'paired UI evidence count');
for (const implementation of ['original-v3.5.0', 'nex']) {
  for (const surface of pairedSurfaces) {""",
)

replace_once(
    capture_path,
    """const bySurface = Object.fromEntries(
  ['popup-default', 'options-default'].map((surface) => {""",
    """const bySurface = Object.fromEntries(
  pairedSurfaces.map((surface) => {""",
)

replace_once(capture_path, '  schemaVersion: 2,', '  schemaVersion: 3,')
replace_once(
    capture_path,
    r"""- Surfaces: default Popup and default Options page\n- Evidence: screenshots, rendered text, saved body DOM, normalized anchor targets, computed semantic layout/style metrics, page/extension language signals, packaged locale directories and an en-US/zh-CN/zh-TW default-text matrix""",
    r"""- Surfaces: default Popup, active Fixed Popup, active Switch Popup and default Options page\n- Evidence: screenshots, rendered text, saved body DOM, normalized anchor targets, computed semantic layout/style metrics, page/extension language signals, packaged locale directories and an en-US/zh-CN/zh-TW default-text matrix""",
)

Path(evidence_path).write_text("""# Audit Evidence 02N — Expanded Popup States

## Scope

This checkpoint expands the permanent Original ↔ Nex evidence boundary beyond the default Popup. It does not modify product behavior and is not an acceptance candidate.

## New paired surfaces

The workflow now drives runtime state through background APIs and captures:

- `popup-fixed-active` after applying the default `proxy` profile;
- `popup-switch-active` after applying the default `auto switch` profile.

The original package uses `applyProfile` and waits for `currentProfileName`. Nex uses the profile-workflow `activate-route` command and waits for the exact runtime profile route. Popup clicks are not used because a real browser popup may close after activation.

Each implementation therefore reaches its state through its own production background contract before the same-browser, same-locale, same-viewport screenshot, DOM, text and computed-style capture.

## Permanent artifact contract

Manifest schema 3 requires eight entries:

- four surfaces for official v3.5.0;
- the same four surfaces for Nex.

The existing default Popup, default Options and three-locale matrix remain mandatory. Fixed/Switch entries are added rather than replacing prior evidence.

The first ordinary schema-3 artifact is diagnostic. It must reveal the actual original result-selector, active-row, current-site and auxiliary-control structure before any product correction is attempted.

## Verification boundary

The evidence expansion must pass the full atomic repository validation, then a fresh ordinary-Head workflow must successfully drive both implementations through both active profiles. No visual parity claim is made until the resulting paired artifact is inspected.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
""")

subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', capture_path, evidence_path],
    check=True,
)
