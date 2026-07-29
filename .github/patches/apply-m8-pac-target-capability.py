from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new))


capability = Path('apps/extension/src/lib/browser-target-capabilities.ts')
capability.write_text(
    """export type PacProfileCapabilityReason =
  | 'proxy-settings'
  | 'proxy-script-registration'
  | 'missing-proxy-settings';

export interface PacProfileCapability {
  readonly supported: boolean;
  readonly reason: PacProfileCapabilityReason;
}

export interface BrowserTargetCapabilities {
  readonly pacProfiles: PacProfileCapability;
}

interface BrowserProxySettingsProbe {
  readonly get?: unknown;
  readonly set?: unknown;
}

interface BrowserProxyApiProbe {
  readonly settings?: BrowserProxySettingsProbe;
  readonly register?: unknown;
  readonly registerProxyScript?: unknown;
}

function callable(value: unknown): boolean {
  return typeof value === 'function';
}

export function inspectBrowserTargetCapabilities(
  proxyApi: BrowserProxyApiProbe | undefined,
): BrowserTargetCapabilities {
  if (callable(proxyApi?.register) || callable(proxyApi?.registerProxyScript)) {
    return {
      pacProfiles: {
        supported: false,
        reason: 'proxy-script-registration',
      },
    };
  }

  if (!callable(proxyApi?.settings?.get) || !callable(proxyApi?.settings?.set)) {
    return {
      pacProfiles: {
        supported: false,
        reason: 'missing-proxy-settings',
      },
    };
  }

  return {
    pacProfiles: {
      supported: true,
      reason: 'proxy-settings',
    },
  };
}

export function currentBrowserTargetCapabilities(): BrowserTargetCapabilities {
  const proxyApi =
    typeof browser === 'undefined'
      ? undefined
      : (browser.proxy as unknown as BrowserProxyApiProbe | undefined);
  return inspectBrowserTargetCapabilities(proxyApi);
}
"""
)

capability_test = Path('apps/extension/src/lib/browser-target-capabilities.test.ts')
capability_test.write_text(
    """import { describe, expect, it } from 'vitest';

import { inspectBrowserTargetCapabilities } from './browser-target-capabilities';

describe('browser target capabilities', () => {
  const proxySettings = {
    get: () => undefined,
    set: () => undefined,
  };

  it('supports PAC profiles through writable proxy.settings', () => {
    expect(inspectBrowserTargetCapabilities({ settings: proxySettings }).pacProfiles).toEqual({
      supported: true,
      reason: 'proxy-settings',
    });
  });

  it.each(['register', 'registerProxyScript'] as const)(
    'preserves the original unsupported PAC branch for proxy.%s targets',
    (method) => {
      expect(
        inspectBrowserTargetCapabilities({
          settings: proxySettings,
          [method]: () => undefined,
        }).pacProfiles,
      ).toEqual({
        supported: false,
        reason: 'proxy-script-registration',
      });
    },
  );

  it('fails closed when the target lacks writable proxy.settings', () => {
    expect(inspectBrowserTargetCapabilities(undefined).pacProfiles).toEqual({
      supported: false,
      reason: 'missing-proxy-settings',
    });
    expect(
      inspectBrowserTargetCapabilities({ settings: { get: () => undefined } }).pacProfiles,
    ).toEqual({
      supported: false,
      reason: 'missing-proxy-settings',
    });
  });
});
"""
)

app = Path('apps/extension/src/entrypoints/options/App.svelte')
replace_once(
    app,
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n  import { currentAppLocale } from '../../lib/i18n';\n",
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n  import { currentBrowserTargetCapabilities } from '../../lib/browser-target-capabilities';\n  import { currentAppLocale } from '../../lib/i18n';\n",
    'Options capability import',
)
replace_once(
    app,
    "  const locale = currentAppLocale();\n\n  let allProfiles",
    "  const locale = currentAppLocale();\n  const browserTargetCapabilities = currentBrowserTargetCapabilities();\n\n  let allProfiles",
    'Options capability resolution',
)
replace_once(
    app,
    "          existingNames={profiles.map((profile) => profile.name)}\n          disabled={saving || view?.busy === true}\n          onCancel={cancelNewProfile}\n",
    "          existingNames={profiles.map((profile) => profile.name)}\n          disabled={saving || view?.busy === true}\n          pacCapability={browserTargetCapabilities.pacProfiles}\n          onCancel={cancelNewProfile}\n",
    'New Profile capability wiring',
)

new_profile = Path('apps/extension/src/entrypoints/options/NewProfileDialog.svelte')
replace_once(
    new_profile,
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n  import { currentAppLocale, type AppLocale } from '../../lib/i18n';\n",
    "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n  import type { PacProfileCapability } from '../../lib/browser-target-capabilities';\n  import { currentAppLocale, type AppLocale } from '../../lib/i18n';\n",
    'New Profile capability type import',
)
replace_once(
    new_profile,
    "  export let disabled = false;\n  export let pacSupported = true;\n  export let locale",
    "  export let disabled = false;\n  export let pacCapability: PacProfileCapability = {\n    supported: true,\n    reason: 'proxy-settings',\n  };\n  export let locale",
    'New Profile capability prop',
)
replace_once(
    new_profile,
    "    !disabled && !submitting && errorKey === undefined && (kind !== 'pac' || pacSupported);",
    "    !disabled &&\n    !submitting &&\n    errorKey === undefined &&\n    (kind !== 'pac' || pacCapability.supported);",
    'New Profile create guard',
)
replace_once(
    new_profile,
    "    data-typed-locale={locale}\n  >",
    "    data-typed-locale={locale}\n    data-pac-profile-supported={pacCapability.supported}\n    data-pac-profile-capability-reason={pacCapability.reason}\n  >",
    'New Profile capability evidence attributes',
)
replace_once(
    new_profile,
    "          <label class:disabled-choice={choice.kind === 'pac' && !pacSupported}>",
    "          <label class:disabled-choice={choice.kind === 'pac' && !pacCapability.supported}>",
    'PAC disabled class',
)
replace_once(
    new_profile,
    "              disabled={disabled || (choice.kind === 'pac' && !pacSupported)}",
    "              disabled={disabled || (choice.kind === 'pac' && !pacCapability.supported)}",
    'PAC radio disabled state',
)
replace_once(
    new_profile,
    "              {#if choice.kind === 'pac' && !pacSupported}",
    "              {#if choice.kind === 'pac' && !pacCapability.supported}",
    'PAC unsupported warning',
)

components = Path('apps/extension/src/component-rendering.component.spec.ts')
text = components.read_text()
text = text.replace(
    "        pacSupported: true,\n",
    "        pacCapability: { supported: true, reason: 'proxy-settings' },\n",
)
text = text.replace(
    "        pacSupported: false,\n",
    "        pacCapability: { supported: false, reason: 'proxy-script-registration' },\n",
)
if text.count("pacSupported:") != 0:
    raise SystemExit('component PAC capability migration left old props')
replace_anchor = "    expect(body).toContain('data-new-profile-name-input');\n"
if text.count(replace_anchor) != 1:
    raise SystemExit('supported component evidence anchor mismatch')
text = text.replace(
    replace_anchor,
    replace_anchor
    + "    expect(body).toContain('data-pac-profile-supported=\"true\"');\n"
    + "    expect(body).toContain('data-pac-profile-capability-reason=\"proxy-settings\"');\n",
)
unsupported_anchor = "    expect(newProfile).toContain('由于技术限制');\n"
if text.count(unsupported_anchor) != 1:
    raise SystemExit('unsupported component evidence anchor mismatch')
text = text.replace(
    unsupported_anchor,
    unsupported_anchor
    + "    expect(newProfile).toContain('data-pac-profile-supported=\"false\"');\n"
    + "    expect(newProfile).toContain(\n"
    + "      'data-pac-profile-capability-reason=\"proxy-script-registration\"',\n"
    + "    );\n",
)
components.write_text(text)

chromium = Path('scripts/e2e-chromium.mjs')
text = chromium.read_text()
replace_anchor = "    const nameInput = dialog.locator('[data-new-profile-name-input]');\n"
if text.count(replace_anchor) != 1:
    raise SystemExit('supported Chromium capability anchor mismatch')
text = text.replace(
    replace_anchor,
    "    assert.equal(await dialog.getAttribute('data-pac-profile-supported'), 'true');\n"
    "    assert.equal(\n"
    "      await dialog.getAttribute('data-pac-profile-capability-reason'),\n"
    "      'proxy-settings',\n"
    "    );\n"
    + replace_anchor,
)
unsupported_anchor = "  await creationContext.close();\n  creationContext = undefined;\n\n  conflictContext = await chromium.launchPersistentContext"
if text.count(unsupported_anchor) != 1:
    raise SystemExit('unsupported Chromium insertion anchor mismatch')
unsupported = """  const unsupportedPacOptions = await creationContext.newPage();
  await unsupportedPacOptions.addInitScript(() => {
    Object.defineProperty(chrome.proxy, 'registerProxyScript', {
      configurable: true,
      value: () => undefined,
    });
  });
  await unsupportedPacOptions.goto(`chrome-extension://${creationExtensionId}/options.html`);
  await unsupportedPacOptions.waitForLoadState('domcontentloaded');
  await unsupportedPacOptions.locator('[data-new-profile-action]').click();
  const unsupportedPacDialog = unsupportedPacOptions.locator('.new-profile-dialog');
  await unsupportedPacDialog.waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await unsupportedPacDialog.getAttribute('data-pac-profile-supported'),
    'false',
  );
  assert.equal(
    await unsupportedPacDialog.getAttribute('data-pac-profile-capability-reason'),
    'proxy-script-registration',
  );
  assert.equal(
    await unsupportedPacDialog.locator('[data-new-profile-kind="pac"]').isDisabled(),
    true,
  );
  assert.match(await unsupportedPacDialog.innerText(), /由于技术限制/u);
  await unsupportedPacOptions.close();

  await creationContext.close();
  creationContext = undefined;

  conflictContext = await chromium.launchPersistentContext"""
text = text.replace(unsupported_anchor, unsupported)
chromium.write_text(text)

# Close A-12 only after capability signal, UI branch, unit/component coverage, and browser evidence exist.
audit = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith('| A-12 |'):
        lines[index] = '| A-12 | PAC 不支持提示           | `new_profile.jade`                  | 目标不支持时禁用并解释                                         | MUST_MATCH  | DONE     | COMPLETE | Options 通过独立目标能力模块检测原版 `proxy.register/registerProxyScript` 不支持分支及缺失可写 `proxy.settings` 的 fail-closed 分支；当前目标保持支持；组件和 Chromium 页面注入真实验证禁用 radio、原因属性与三语说明 | 保持能力与浏览器回归 |'
        break
else:
    raise SystemExit('A-12 audit row was not found')
for index, line in enumerate(lines):
    if line.startswith('- **仍开放的 MUST_MATCH：5 项。**'):
        lines[index] = '- **仍开放的 MUST_MATCH：4 项。** B-03 Rename 对话框、C-09 协议能力矩阵、D-04 条件类型矩阵、D-05 条件字段矩阵。'
        break
else:
    raise SystemExit('five-item MUST_MATCH summary was not found')
record_index = next(
    (index for index, line in enumerate(lines) if line.startswith('| 2026-07-29 | 完成独立全新 Chromium 工作区内 Fixed/Switch/PAC/Virtual')),
    -1,
)
if record_index == -1:
    raise SystemExit('matrix update record anchor was not found')
lines.insert(
    record_index + 1,
    '| 2026-07-29 | 完成 PAC 目标能力信号：原版 proxy-script-registration 不支持分支、缺失 proxy.settings 的 fail-closed、当前目标支持分支及 Chromium 真实 UI 禁用验证；开放 MUST_MATCH 降至 4 项 |',
)
audit.write_text('\n'.join(lines) + '\n')

status = Path('docs/MILESTONE_8_STATUS.md')
replace_once(
    status,
    '- Fixed, Switch, PAC, and Virtual as the four normal creation types, with one isolated Chromium chain creating all four through the real New Profile dialog and committing them through normal Apply.\n',
    '- Fixed, Switch, PAC, and Virtual as the four normal creation types, with one isolated Chromium chain creating all four through the real New Profile dialog and committing them through normal Apply.\n- PAC creation is governed by an explicit browser-target capability signal: current writable `proxy.settings` targets are supported; original `proxy.register/registerProxyScript` targets and targets without writable settings are disabled with the original-style explanation.\n',
    'M8 PAC capability delivered scope',
)
replace_once(
    status,
    '- target-dependent PAC-disable wiring in the New Profile dialog;\n',
    '',
    'M8 remove PAC capability blocker',
)

checkpoint = Path('docs/MILESTONE_8_SESSION_7_CHECKPOINT.md')
replace_once(
    checkpoint,
    '- The reconciled matrix now retains five `MUST_MATCH` gaps: target-dependent PAC-disable wiring, Rename-dialog parity, protocol capability matrix, Switch condition-type matrix, and Switch condition-field matrix.\n',
    '- The reconciled matrix now retains four `MUST_MATCH` gaps: Rename-dialog parity, protocol capability matrix, Switch condition-type matrix, and Switch condition-field matrix.\n',
    'checkpoint remaining gaps',
)
insert_anchor = '### Control-plane reconciliation and cleanup\n'
section = """### PAC target capability acceptance

- A pure target-capability module accepts PAC creation only when writable `proxy.settings` is available.
- The original ZeroOmega unsupported branch is preserved: `proxy.register` or `proxy.registerProxyScript` disables PAC creation and shows the localized explanation.
- Unknown targets without writable `proxy.settings` fail closed instead of presenting a profile that cannot activate.
- Component rendering covers supported and unsupported capability metadata; Chromium injects the original unsupported API into a real Options page and verifies the PAC radio is disabled.
- A-12 is DONE; the release-blocking `MUST_MATCH` count falls from five to four.

"""
if checkpoint.read_text().count(insert_anchor) != 1:
    raise SystemExit('checkpoint PAC section anchor mismatch')
checkpoint.write_text(checkpoint.read_text().replace(insert_anchor, section + insert_anchor))
text = checkpoint.read_text()
text = text.replace(
    '2. Close or explicitly scope the six remaining `MUST_MATCH` rows without diluting acceptance criteria.',
    '2. Close or explicitly scope the four remaining `MUST_MATCH` rows without diluting acceptance criteria.',
)
checkpoint.write_text(text)

candidate = Path('docs/MILESTONE_8_RELEASE_CANDIDATE.md')
replace_once(
    candidate,
    '- Fixed, Switch, PAC, and Virtual normal profile creation;\n',
    '- Fixed, Switch, PAC, and Virtual normal profile creation, including target-dependent PAC-disable behavior;\n',
    'candidate PAC capability',
)

graph = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
graph.write_text(
    graph.read_text()
    + """
### PAC Profile target capability boundary

- Original ZeroOmega disables PAC Profile creation when the target exposes `browser.proxy.register` or `browser.proxy.registerProxyScript`; this is a product behavior, not an Angular implementation detail.
- Nex centralizes that decision in a pure browser-target capability module. Writable `proxy.settings.get/set` means PAC Profile creation is supported; legacy proxy-script registration APIs take precedence and mark the target unsupported.
- A target without writable `proxy.settings` fails closed. The New Profile dialog receives the resolved capability and exposes stable evidence attributes while retaining the original localized warning and disabled PAC radio.
- Chromium acceptance injects `chrome.proxy.registerProxyScript` before the Options application loads, proving the unsupported branch in a real extension page without adding a production test override.
"""
)

validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
insert_anchor = 'const failures = [];\n'
extra = """const [browserTargetCapabilities, optionsApp, newProfileDialog, componentRendering] =
  await Promise.all([
    readFile('apps/extension/src/lib/browser-target-capabilities.ts', 'utf8'),
    readFile('apps/extension/src/entrypoints/options/App.svelte', 'utf8'),
    readFile('apps/extension/src/entrypoints/options/NewProfileDialog.svelte', 'utf8'),
    readFile('apps/extension/src/component-rendering.component.spec.ts', 'utf8'),
  ]);

"""
if text.count(insert_anchor) != 1:
    raise SystemExit('validator capability read anchor mismatch')
text = text.replace(insert_anchor, extra + insert_anchor)
insert_anchor = "requireAll('unified four-profile creation', chromiumE2e, [\n"
extra = """requireAll('PAC target capability module', browserTargetCapabilities, [
  'proxy-script-registration',
  'missing-proxy-settings',
  'proxy-settings',
  'currentBrowserTargetCapabilities',
]);
requireAll('PAC target capability wiring', optionsApp, [
  'currentBrowserTargetCapabilities',
  'pacCapability={browserTargetCapabilities.pacProfiles}',
]);
requireAll('PAC unsupported New Profile branch', newProfileDialog, [
  'data-pac-profile-supported',
  'data-pac-profile-capability-reason',
  "uiText('newProfile.pac.unsupported', locale)",
]);
requireAll('PAC capability component rendering', componentRendering, [
  "reason: 'proxy-settings'",
  "reason: 'proxy-script-registration'",
  'data-pac-profile-supported',
]);
requireAll('PAC target capability Chromium acceptance', chromiumE2e, [
  "Object.defineProperty(chrome.proxy, 'registerProxyScript'",
  "'data-pac-profile-supported'",
  "'proxy-script-registration'",
  "locator('[data-new-profile-kind=\"pac\"]')",
]);

const pacCapabilityRow = audit.split('\n').find((line) => line.startsWith('| A-12 '));
if (!pacCapabilityRow || !pacCapabilityRow.includes('| DONE') || !pacCapabilityRow.includes('Chromium')) {
  failures.push('A-12 must remain DONE with target capability and Chromium evidence');
}

"""
if text.count(insert_anchor) != 1:
    raise SystemExit('validator PAC capability guard anchor mismatch')
validator.write_text(text.replace(insert_anchor, extra + insert_anchor))
