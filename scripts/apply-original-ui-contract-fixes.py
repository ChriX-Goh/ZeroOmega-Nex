from pathlib import Path
import re
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


def replace_count(path: str, old: str, new: str, expected: int) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != expected:
        raise RuntimeError(f'{path}: expected {expected} matches, found {count}: {old!r}')
    target.write_text(source.replace(old, new))


app_path = 'apps/extension/src/entrypoints/popup/App.svelte'
style_path = 'apps/extension/src/entrypoints/popup/style.css'
validator_path = 'scripts/validate-ui-compatibility.mjs'
chromium_path = 'scripts/e2e-chromium.mjs'
firefox_path = 'scripts/e2e-firefox.mjs'
capture_path = 'scripts/capture-original-nex-ui-evidence.mjs'
expanded_evidence_path = 'docs/AUDIT_EVIDENCE_02N_EXPANDED_POPUP_STATES.md'
removal_evidence_path = 'docs/AUDIT_EVIDENCE_02O_POPUP_RESULT_CONTROL_REMOVAL.md'

replace_once(app_path, '    listPopupProfileResultRoutes,\n', '')
replace_once(
    app_path,
    """    readonly profileId?: string;
    readonly resultRoute?: ProfileRouteTarget;
    readonly resultItems?: readonly ResultRouteItem[];
""",
    '',
)
replace_once(app_path, '  let settingResult = false;\n', '')

replace_once(
    app_path,
    """  function configuredResultRoute(profile: UserProfile): ProfileRouteTarget | undefined {
    if (profile.kind === 'switch') return profile.defaultRoute;
    if (profile.kind === 'virtual') return profile.targetRoute;
    return undefined;
  }

  function popupProfileResultItems(
    spec: ProfileSpec,
    profileId: string,
  ): readonly ResultRouteItem[] {
    return listPopupProfileResultRoutes(spec, profileId).map((route) => ({
      key: routeKey(route),
      route,
      name: routeName(spec, route),
    }));
  }

""",
    '',
)

replace_once(
    app_path,
    """      const resultRoute = configuredResultRoute(profile);
      const profileResultItems = resultRoute
        ? popupProfileResultItems(spec, profile.id)
        : undefined;
""",
    '',
)
replace_once(app_path, '        profileId: profile.id,\n', '')
replace_once(
    app_path,
    """        ...(resultRoute === undefined ? {} : { resultRoute }),
        ...(profileResultItems === undefined ? {} : { resultItems: profileResultItems }),
""",
    '',
)

app = Path(app_path).read_text()
pattern = re.compile(
    r"\n  async function setProfileResult\(item: QuickSwitchItem, event: Event\): Promise<void> \{.*?\n  \}\n\n  async function activateRoute",
    re.S,
)
app, count = pattern.subn('\n  async function activateRoute', app, count=1)
if count != 1:
    raise RuntimeError(f'{app_path}: setProfileResult function mismatch')
Path(app_path).write_text(app)

replace_count(app_path, '    settingResult ||\n', '', 2)
replace_once(
    app_path,
    'disabled={settingTemporaryRule || switching || settingResult || addingCondition}',
    'disabled={settingTemporaryRule || switching || addingCondition}',
)
replace_once(
    app_path,
    """        <div
          class:has-result={item.resultRoute !== undefined &&
            sameRoute(runtime?.activeRoute, item.route)}
          class="profile-row"
        >""",
    '        <div class="profile-row">',
)
replace_once(
    app_path,
    """            <span class="profile-name">
              {item.name}
              {#if item.resultRoute && state && sameRoute(runtime?.activeRoute, item.route)}
                <span class="profile-result-label"
                  >[{routeName(state.applied, item.resultRoute)}]</span
                >
              {/if}
            </span>""",
    """            <span class="profile-name">{item.name}</span>""",
)

app = Path(app_path).read_text()
result_control_pattern = re.compile(
    r"\n          \{#if item\.resultRoute && item\.resultItems && item\.resultItems\.length !== 0 && sameRoute\(runtime\?\.activeRoute, item\.route\)\}.*?\n          \{/if\}",
    re.S,
)
app, count = result_control_pattern.subn('', app, count=1)
if count != 1:
    raise RuntimeError(f'{app_path}: result control template mismatch')
Path(app_path).write_text(app)

style = Path(style_path).read_text()
style_pattern = re.compile(
    r"\n\.profile-result-label \{.*?\n\.profile-result-control select:focus-visible \{.*?\n\}\n",
    re.S,
)
style, count = style_pattern.subn('\n', style, count=1)
if count != 1:
    raise RuntimeError(f'{style_path}: result-control styles mismatch')
Path(style_path).write_text(style)

replace_once(
    validator_path,
    """    popupApp.includes('data-popup-result-profile') &&
      popupApp.includes("action: 'set-popup-profile-result'") &&
      popupApp.includes('profile-result-label') &&
      popupCondition.includes('setPopupProfileResultDraft') &&
      popupCondition.includes('profile.defaultRoute = structuredClone(route)') &&
      popupCondition.includes('profile.targetRoute = structuredClone(route)') &&
      popupCondition.includes('listPopupProfileResultRoutes'),
    'Popup must display and change valid Switch/Virtual result routes through the verified background transaction.',""",
    """    !popupApp.includes('data-popup-result-profile') &&
      !popupApp.includes('profile-result-label') &&
      !popupApp.includes("action: 'set-popup-profile-result'") &&
      !popupApp.includes('listPopupProfileResultRoutes') &&
      popupCondition.includes('setPopupProfileResultDraft') &&
      popupCondition.includes('profile.defaultRoute = structuredClone(route)') &&
      popupCondition.includes('profile.targetRoute = structuredClone(route)') &&
      popupCondition.includes('listPopupProfileResultRoutes') &&
      chromiumE2e.includes('Active default Switch exposed a result selector') &&
      firefoxE2e.includes('Active default Switch exposed a result selector'),
    'Ordinary Popup must not expose the Nex-only Switch/Virtual result editor; the verified background mutation capability remains available outside the original-facing Popup.',""",
)

replace_once(
    chromium_path,
    """  assert.equal(
    (await initialPopup.locator('[data-original-popup-icon-position="leading"]').count()) >= 3,
    true,
  );
  await initialPopup.close();""",
    """  assert.equal(
    (await initialPopup.locator('[data-original-popup-icon-position="leading"]').count()) >= 3,
    true,
  );
  const defaultSwitchActivation = await initialPopup.evaluate(async () => {
    const channel = 'zeroomega-nex/profile-workflow/v1';
    const current = await chrome.runtime.sendMessage({ channel, action: 'get' });
    const profile = current.state.applied.profiles.find(
      (candidate) => candidate.name === 'auto switch',
    );
    if (!profile) return { ok: false, reason: 'missing default Switch' };
    return chrome.runtime.sendMessage({
      channel,
      action: 'activate-route',
      expectedAppliedRevisionId: current.state.applied.revision.id,
      route: { kind: 'profile', profileId: profile.id },
    });
  });
  assert.equal(
    defaultSwitchActivation?.ok,
    true,
    `Default Switch activation failed: ${JSON.stringify(defaultSwitchActivation)}`,
  );
  await initialPopup.reload();
  const activeDefaultSwitch = initialPopup.getByRole('button', {
    name: 'auto switch',
    exact: true,
  });
  await activeDefaultSwitch.waitFor();
  assert.equal(await activeDefaultSwitch.isDisabled(), true);
  assert.equal((await activeDefaultSwitch.innerText()).trim(), 'auto switch');
  assert.equal(
    await initialPopup.locator('[data-popup-result-profile]').count(),
    0,
    'Active default Switch exposed a result selector in the Chromium Popup',
  );
  assert.equal(
    await initialPopup.locator('.profile-result-label').count(),
    0,
    'Active default Switch exposed a result label in the Chromium Popup',
  );
  const restoredSystem = await initialPopup.evaluate(async () => {
    const channel = 'zeroomega-nex/profile-workflow/v1';
    const current = await chrome.runtime.sendMessage({ channel, action: 'get' });
    return chrome.runtime.sendMessage({
      channel,
      action: 'activate-route',
      expectedAppliedRevisionId: current.state.applied.revision.id,
      route: { kind: 'system' },
    });
  });
  assert.equal(restoredSystem?.ok, true, `System restore failed: ${JSON.stringify(restoredSystem)}`);
  await initialPopup.close();""",
)

replace_once(
    firefox_path,
    """  assert.equal(
    (await driver.findElements(By.css('.profile-result-label'))).length,
    0,
    'Inactive default Switch exposed a result label in the Direct Popup state',
  );
  assert.equal(
    await driver.executeAsyncScript(`""",
    """  assert.equal(
    (await driver.findElements(By.css('.profile-result-label'))).length,
    0,
    'Inactive default Switch exposed a result label in the Direct Popup state',
  );
  const defaultSwitchWorkflow = await sendFirefoxWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'get',
  });
  assert.equal(
    defaultSwitchWorkflow?.ok,
    true,
    `Firefox default Switch workflow failed: ${JSON.stringify(defaultSwitchWorkflow)}`,
  );
  const defaultSwitchProfile = defaultSwitchWorkflow.state.applied.profiles.find(
    (candidate) => candidate.name === 'auto switch',
  );
  assert.equal(defaultSwitchProfile?.kind, 'switch', 'Firefox default auto switch was not found');
  const defaultSwitchActivated = await sendFirefoxWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'activate-route',
    expectedAppliedRevisionId: defaultSwitchWorkflow.state.applied.revision.id,
    route: { kind: 'profile', profileId: defaultSwitchProfile.id },
  });
  assert.equal(
    defaultSwitchActivated?.ok,
    true,
    `Firefox default Switch activation failed: ${JSON.stringify(defaultSwitchActivated)}`,
  );
  await navigateExtensionPage('popup.html');
  const activeDefaultSwitch = await driver.wait(
    until.elementLocated(By.xpath("//button[normalize-space(.)='auto switch']")),
    15_000,
  );
  await driver.wait(until.elementIsDisabled(activeDefaultSwitch), 15_000);
  assert.equal((await activeDefaultSwitch.getText()).trim(), 'auto switch');
  assert.equal(
    (await driver.findElements(By.css('[data-popup-result-profile]'))).length,
    0,
    'Active default Switch exposed a result selector in the Firefox Popup',
  );
  assert.equal(
    (await driver.findElements(By.css('.profile-result-label'))).length,
    0,
    'Active default Switch exposed a result label in the Firefox Popup',
  );
  const directRestored = await sendFirefoxWorkflowCommand({
    channel: 'zeroomega-nex/profile-workflow/v1',
    action: 'activate-route',
    expectedAppliedRevisionId: defaultSwitchWorkflow.state.applied.revision.id,
    route: { kind: 'direct' },
  });
  assert.equal(
    directRestored?.ok,
    true,
    `Firefox Direct restore failed: ${JSON.stringify(directRestored)}`,
  );
  await navigateExtensionPage('popup.html');
  const restoredDirect = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(., '直接連線')]")),
    15_000,
  );
  await driver.wait(until.elementIsDisabled(restoredDirect), 15_000);
  assert.equal(
    await driver.executeAsyncScript(`""",
)

replace_once(
    capture_path,
    """assert.equal(localeMatrix.length, 6, 'paired locale matrix count');

const pairedSurfaces = [""",
    """assert.equal(localeMatrix.length, 6, 'paired locale matrix count');

const pairedSurfaces = [""",
)

replace_once(
    capture_path,
    """for (const implementation of ['original-v3.5.0', 'nex']) {
  for (const surface of pairedSurfaces) {
    assert.equal(
      entries.filter(
        (entry) => entry.implementation === implementation && entry.surface === surface,
      ).length,
      1,
      `missing ${implementation}/${surface} evidence`,
    );
  }
}

const bySurface = Object.fromEntries(""",
    """for (const implementation of ['original-v3.5.0', 'nex']) {
  for (const surface of pairedSurfaces) {
    assert.equal(
      entries.filter(
        (entry) => entry.implementation === implementation && entry.surface === surface,
      ).length,
      1,
      `missing ${implementation}/${surface} evidence`,
    );
  }
}
const originalSwitchEntry = entries.find(
  (entry) =>
    entry.implementation === 'original-v3.5.0' && entry.surface === 'popup-switch-active',
);
const nexSwitchEntry = entries.find(
  (entry) => entry.implementation === 'nex' && entry.surface === 'popup-switch-active',
);
assert.equal(originalSwitchEntry.layoutMetrics.resultControl.length, 0, 'Original active Switch result control');
assert.equal(nexSwitchEntry.layoutMetrics.resultControl.length, 0, 'Nex active Switch result control');
assert.deepEqual(
  nexSwitchEntry.textLines,
  originalSwitchEntry.textLines,
  'Active Switch Popup text must match Original exactly',
);

const bySurface = Object.fromEntries(""",
)

expanded = Path(expanded_evidence_path).read_text()
marker = 'Ordinary Head `1feee647d9d2cd2a4b0acfa89b2bb9172a4fff04` successfully produced the first schema-3 artifact.'
if marker not in expanded:
    expanded += """

## First schema-3 result

Ordinary Head `1feee647d9d2cd2a4b0acfa89b2bb9172a4fff04` successfully produced the first schema-3 artifact and passed all six permanent gates. Artifact `8845149522` (`sha256:7dea6fc40f77ab5c8cbb321e2f8dcaccb84206917ddf786b15c5f04189c9056e`) proves both implementations reached active `proxy` and active `auto switch` through their production background contracts.

The active Fixed surfaces have the same visible structure and text. The active Switch surfaces expose a structural defect:

- Original keeps a single `auto switch` row and no `<select>`;
- Nex appends `[Direct]`, adds a visible `Result` label and renders a result-profile dropdown;
- Nex Popup height increases by 29px;
- manifest comparison reports `auto switch [Direct]`, `Result`, `Direct` and `System Proxy` only in Nex, with plain `auto switch` missing from Nex.

This is direct original evidence that the ordinary Popup result editor is a Nex-only invention. Backend mutation, condition-result computation, temporary rules and Options editing are not implicated.
"""
Path(expanded_evidence_path).write_text(expanded)

Path(removal_evidence_path).write_text("""# Audit Evidence 02O — Popup Result Control Removal

## Scope

This checkpoint records one bounded original-facing correction identified by schema-3 paired evidence. It removes only the ordinary Popup result suffix and result-profile dropdown. It is not an acceptance candidate.

## Official behavior

With default `auto switch` active, official ZeroOmega v3.5.0 renders the same compact profile list as the default Popup. The active row text is exactly `auto switch`; there is no result suffix, label or select control.

## Nex defect

Nex rendered `auto switch [Direct]`, followed by a `Result` label and dropdown. This added an unproven editing workflow and increased Popup height by 29px.

## Bounded correction

The ordinary Popup now:

- renders every profile row as one line;
- keeps the active Switch label exactly `auto switch`;
- exposes no result label or result-profile select in inactive or active states;
- removes local result-editor state, handler and dead CSS.

The correction deliberately retains:

- `set-popup-profile-result` in the background command boundary;
- Switch/Virtual result mutation operations;
- Options editing capability;
- current-site condition result choices;
- temporary-rule result choices;
- Toolbar result projection.

## Permanent verification

Chromium and Firefox E2E explicitly activate the default `auto switch`, require its exact one-line text and assert that both result selectors and labels remain absent. Schema-3 paired evidence requires zero result controls for Original and Nex and exact active-Switch text-line equality.

The correction must pass the atomic repository validation and then a fresh ordinary Head with all six permanent gates. Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
""")

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        app_path,
        style_path,
        validator_path,
        chromium_path,
        firefox_path,
        capture_path,
        expanded_evidence_path,
        removal_evidence_path,
    ],
    check=True,
)
