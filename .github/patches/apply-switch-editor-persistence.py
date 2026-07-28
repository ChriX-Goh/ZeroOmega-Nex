from pathlib import Path
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


Path('apps/extension/src/entrypoints/options/switch-editor-state.ts').write_text(r'''export const SWITCH_SOURCE_EDITOR_STATE_PREFIX =
  'zeroomega-nex/options/switch-source-editor/' as const;

interface SwitchEditorStateStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function switchSourceEditorStateKey(profileId: string): string {
  if (!profileId) throw new TypeError('Switch Profile ID must not be empty');
  return `${SWITCH_SOURCE_EDITOR_STATE_PREFIX}${profileId}`;
}

export function readSwitchSourceEditorMode(
  profileId: string,
  storage: SwitchEditorStateStorage = localStorage,
): boolean {
  try {
    return storage.getItem(switchSourceEditorStateKey(profileId)) === 'source';
  } catch {
    return false;
  }
}

export function storeSwitchSourceEditorMode(
  profileId: string,
  sourceMode: boolean,
  storage: SwitchEditorStateStorage = localStorage,
): void {
  try {
    const key = switchSourceEditorStateKey(profileId);
    if (sourceMode) storage.setItem(key, 'source');
    else storage.removeItem(key);
  } catch {
    // UI-state persistence must never block profile editing.
  }
}
''')

Path('apps/extension/src/entrypoints/options/switch-editor-state.test.ts').write_text(r'''import { describe, expect, it } from 'vitest';

import {
  readSwitchSourceEditorMode,
  storeSwitchSourceEditorMode,
  switchSourceEditorStateKey,
} from './switch-editor-state';

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('Switch source editor UI state', () => {
  it('persists source mode independently for stable Profile IDs', () => {
    const storage = new MemoryStorage();
    const firstKey = switchSourceEditorStateKey('switch-first');
    expect(firstKey).toBe('zeroomega-nex/options/switch-source-editor/switch-first');
    expect(readSwitchSourceEditorMode('switch-first', storage)).toBe(false);

    storeSwitchSourceEditorMode('switch-first', true, storage);
    expect(readSwitchSourceEditorMode('switch-first', storage)).toBe(true);
    expect(readSwitchSourceEditorMode('switch-second', storage)).toBe(false);

    storeSwitchSourceEditorMode('switch-first', false, storage);
    expect(readSwitchSourceEditorMode('switch-first', storage)).toBe(false);
    expect(storage.values.has(firstKey)).toBe(false);
  });

  it('does not let unavailable UI storage block the editor', () => {
    const unavailable = {
      getItem: () => {
        throw new Error('unavailable');
      },
      setItem: () => {
        throw new Error('unavailable');
      },
      removeItem: () => {
        throw new Error('unavailable');
      },
    };
    expect(readSwitchSourceEditorMode('switch-safe', unavailable)).toBe(false);
    expect(() => storeSwitchSourceEditorMode('switch-safe', true, unavailable)).not.toThrow();
  });
});
''')

replace_once(
    'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
    "  import AttachedRuleListConfig from './AttachedRuleListConfig.svelte';\n",
    "  import AttachedRuleListConfig from './AttachedRuleListConfig.svelte';\n  import {\n    readSwitchSourceEditorMode,\n    storeSwitchSourceEditorMode,\n  } from './switch-editor-state';\n",
)

replace_once(
    'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
    '''  async function toggleSource(): Promise<void> {
    if (!editSource) {
      const composed = composeSwitchProfileSource(spec, profileId);
      if (!composed.ok) {
        sourceError = composed.error;
        return;
      }
      sourceText = composed.source;
      sourceTouched = false;
      onSourceDirtyChange(false);
      sourceError = undefined;
      editSource = true;
      return;
    }
    if (!(await commitSourceIfNeeded())) return;
    editSource = false;
    sourceError = undefined;
  }
''',
    '''  function enterSourceMode(): boolean {
    const composed = composeSwitchProfileSource(spec, profileId);
    if (!composed.ok) {
      sourceError = composed.error;
      storeSwitchSourceEditorMode(profileId, false);
      return false;
    }
    sourceText = composed.source;
    sourceTouched = false;
    onSourceDirtyChange(false);
    sourceError = undefined;
    editSource = true;
    storeSwitchSourceEditorMode(profileId, true);
    return true;
  }

  async function toggleSource(): Promise<void> {
    if (!editSource) {
      enterSourceMode();
      return;
    }
    if (!(await commitSourceIfNeeded())) return;
    editSource = false;
    storeSwitchSourceEditorMode(profileId, false);
    sourceError = undefined;
  }
''',
)

replace_once(
    'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
    '''  onMount(() => {
    onRegisterBeforeAction(commitSourceIfNeeded);
    return () => {
''',
    '''  onMount(() => {
    onRegisterBeforeAction(commitSourceIfNeeded);
    if (readSwitchSourceEditorMode(profileId)) enterSourceMode();
    return () => {
''',
)

replace_once(
    'apps/extension/src/entrypoints/options/SwitchProfileEditor.svelte',
    '  <section class="settings-section switch-rules-section">\n',
    '''  <section
    class="settings-section switch-rules-section"
    data-switch-source-mode={editSource ? 'source' : 'table'}
  >
''',
)

replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    "    expect(body).toContain('data-switch-rules-table');\n",
    "    expect(body).toContain('data-switch-source-mode=\"table\"');\n    expect(body).toContain('data-switch-rules-table');\n",
)

# Insert the real browser persistence and drag-order path immediately after backup restoration.
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await options.getByRole('button', { name: 'switch', exact: true }).waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  await options.getByRole('button', { name: 'pac', exact: true }).click();
''',
    '''  const switchNavigation = options.getByRole('button', { name: 'switch', exact: true });
  await switchNavigation.waitFor();
  await options.getByRole('button', { name: 'fixed', exact: true }).waitFor();

  await switchNavigation.click();
  const switchRulesSection = options.locator('[data-switch-source-mode]');
  await switchRulesSection.waitFor({ state: 'visible', timeout: 20_000 });
  const switchSourceToggle = switchRulesSection.locator('[data-switch-source-toggle]');
  await switchSourceToggle.click();
  await switchRulesSection.locator('[data-switch-source-editor]').waitFor();
  const switchProfileId = await worker.evaluate(async () => {
    const key = 'zeroomega-nex/profile-workflow/v1/state';
    const workflow = (await chrome.storage.local.get(key))[key];
    const profile = workflow?.draft?.profiles?.find((candidate) => candidate.name === 'switch');
    if (!profile || profile.kind !== 'switch') throw new Error('Switch Profile fixture is missing');
    return profile.id;
  });
  const switchEditorStateKey = `zeroomega-nex/options/switch-source-editor/${switchProfileId}`;
  assert.equal(
    await options.evaluate((key) => localStorage.getItem(key), switchEditorStateKey),
    'source',
  );

  await options.reload();
  await options.waitForLoadState('domcontentloaded');
  const restoredSwitchRulesSection = options.locator('[data-switch-source-mode="source"]');
  await restoredSwitchRulesSection.waitFor({ state: 'visible', timeout: 20_000 });
  await restoredSwitchRulesSection.locator('[data-switch-source-editor]').waitFor();
  await restoredSwitchRulesSection.locator('[data-switch-source-toggle]').click();
  await options.locator('[data-switch-rules-table]').waitFor({ state: 'visible', timeout: 20_000 });
  assert.equal(
    await options.evaluate((key) => localStorage.getItem(key), switchEditorStateKey),
    null,
  );

  const switchRows = options.locator('[data-switch-rule-row]');
  await options.getByRole('button', { name: 'Add condition', exact: true }).click();
  await assertEventually(
    async () => (await switchRows.count()) === 2,
    'Switch editor did not append the second rule',
  );
  const firstPattern = switchRows.nth(0).getByLabel('Rule 1 pattern');
  const secondPattern = switchRows.nth(1).getByLabel('Rule 2 pattern');
  await firstPattern.fill('first.drag.invalid');
  await firstPattern.press('Tab');
  await secondPattern.fill('second.drag.invalid');
  await secondPattern.press('Tab');
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        const profile = workflow?.draft?.profiles?.find((candidate) => candidate.name === 'switch');
        return (
          profile?.kind === 'switch' &&
          profile.rules?.[0]?.condition?.pattern === 'first.drag.invalid' &&
          profile.rules?.[1]?.condition?.pattern === 'second.drag.invalid'
        );
      }),
    'Switch rule patterns did not reach the Draft before dragging',
  );
  await switchRows.nth(0).locator('[data-switch-drag-handle]').dragTo(switchRows.nth(1));
  await assertEventually(
    async () =>
      (await switchRows.nth(0).getByLabel('Rule 1 pattern').inputValue()) ===
        'second.drag.invalid' &&
      (await switchRows.nth(1).getByLabel('Rule 2 pattern').inputValue()) === 'first.drag.invalid',
    'Switch drag handle did not reorder the visible rows',
  );
  await assertEventually(
    async () =>
      worker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        const profile = workflow?.draft?.profiles?.find((candidate) => candidate.name === 'switch');
        return (
          profile?.kind === 'switch' &&
          profile.rules?.[0]?.condition?.pattern === 'second.drag.invalid' &&
          profile.rules?.[1]?.condition?.pattern === 'first.drag.invalid'
        );
      }),
    'Switch drag order was not persisted in the Draft',
  );
  await options.reload();
  await options.waitForLoadState('domcontentloaded');
  await options.locator('[data-switch-rules-table]').waitFor({ state: 'visible', timeout: 20_000 });
  const reloadedSwitchRows = options.locator('[data-switch-rule-row]');
  assert.equal(
    await reloadedSwitchRows.nth(0).getByLabel('Rule 1 pattern').inputValue(),
    'second.drag.invalid',
  );
  assert.equal(
    await reloadedSwitchRows.nth(1).getByLabel('Rule 2 pattern').inputValue(),
    'first.drag.invalid',
  );

  await options.getByRole('button', { name: 'pac', exact: true }).click();
''',
)

# Permanent parity guard: source mode is independent UI state and drag order has browser evidence.
validator_path = Path('scripts/validate-ui-compatibility.mjs')
validator = validator_path.read_text()
validator = validator.replace(
    "const switchSourcePath = 'packages/profile-workflow/src/switch-source.ts';\n",
    "const switchSourcePath = 'packages/profile-workflow/src/switch-source.ts';\nconst switchEditorStatePath =\n  'apps/extension/src/entrypoints/options/switch-editor-state.ts';\n",
    1,
)
validator = validator.replace(
    '''  switchSource,
  attachedRuleListConfig,
''',
    '''  switchSource,
  switchEditorState,
  attachedRuleListConfig,
''',
    1,
)
validator = validator.replace(
    '''  readFile(switchSourcePath, 'utf8'),
  readFile(attachedRuleListConfigPath, 'utf8'),
''',
    '''  readFile(switchSourcePath, 'utf8'),
  readFile(switchEditorStatePath, 'utf8'),
  readFile(attachedRuleListConfigPath, 'utf8'),
''',
    1,
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''      switchSource.includes("lines.push('', `* +${defaultName}`, '')") &&
      !switchProfile.includes('Rule enabled') &&
''',
    '''      switchSource.includes("lines.push('', `* +${defaultName}`, '')") &&
      switchEditorState.includes('SWITCH_SOURCE_EDITOR_STATE_PREFIX') &&
      switchEditorState.includes('switchSourceEditorStateKey(profileId)') &&
      switchProfile.includes('readSwitchSourceEditorMode(profileId)') &&
      switchProfile.includes('storeSwitchSourceEditorMode(profileId, true)') &&
      switchProfile.includes('data-switch-source-mode') &&
      chromiumE2e.includes("localStorage.getItem(key), switchEditorStateKey") &&
      chromiumE2e.includes("locator('[data-switch-drag-handle]').dragTo") &&
      chromiumE2e.includes('Switch drag order was not persisted in the Draft') &&
      !switchProfile.includes('Rule enabled') &&
''',
)

# Durable source-backed documentation.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(
    kg_path.read_text()
    + '''
- 原版 `SwitchProfileCtrl` 使用 `omegaTarget.state('web._profileEditor.' + profile.name)` 保存 `{editSource}`，页面初始化时恢复；规则正文仍从当前 Profile compose，不把未提交源码文本塞入 UI 状态。Nex 对齐该边界，但以稳定 Profile ID 作为 localStorage key，重命名不丢模式；进入/成功退出时写/清状态，compose 失败时回退表格。
- 原版规则表使用 `ui-sortable` + `.sort-bar` 直接改变 `profile.rules` 顺序。Nex 的 drag handle 现在有 Chromium 真实拖放、Draft 顺序及重载后 DOM 顺序三重验证，键盘 Up/Down 仍作为无拖放环境后备。
'''
)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
audit = audit_path.read_text()
audit = audit.replace(
    '| D-03 | 拖动排序         | 同上                                           | drag handle 排序                           | MUST_MATCH | PARTIAL  | N/A     | 已有原生 drag handle 与键盘 Up/Down 后备；尚缺浏览器拖放 E2E                                                                                                                                                                            | 加 Chromium 拖放测试   |',
    '| D-03 | 拖动排序         | 同上                                           | drag handle 排序                           | MUST_MATCH | DONE     | N/A     | 原生 drag handle 直接重排 typed Draft；Chromium 真实拖放验证 DOM、Draft 与重载后顺序；键盘 Up/Down 保留为后备                                                                                                                           | 保持回归测试           |',
)
audit = audit.replace(
    '| D-12 | 图形/源码切换    | 同上                                           | Edit Source，错误显示                      | MUST_MATCH | DONE     | PARTIAL | 已实现原版 result-enabled 双向 compose/parse、行级错误及 Apply/导航守卫                                                                                                                                                                 | locale、重载持久化 E2E |',
    '| D-12 | 图形/源码切换    | 同上                                           | Edit Source，错误显示                      | MUST_MATCH | DONE     | PARTIAL | 已实现 result-enabled 双向 compose/parse、行级错误、Apply/导航守卫；按原版独立 UI state 语义以稳定 Profile ID 保存模式，Chromium 验证进入、重载恢复、退出清理                                                    | 补 locale               |',
)
audit = audit.replace(
    '| J-06 | Switch 表格/附属 RuleList E2E      | MUST_MATCH | PARTIAL  | Chromium 覆盖附属创建、隐藏、启停、路由、文本/header 与解除；拖序仍缺                                                      | 增加拖放与 Firefox 附属 E2E      |',
    '| J-06 | Switch 表格/附属 RuleList E2E      | MUST_MATCH | PARTIAL  | Chromium 覆盖源码模式重载恢复、drag handle 排序及附属创建/隐藏/启停/路由/文本/header/解除；Firefox 附属交互仍缺                             | 增加 Firefox 附属 E2E             |',
)
audit_path.write_text(audit)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
status = status.replace(
    '**Last completed exact-Head verification:** `f5412dc66940849a58f1aa056d1b904cf984490f`; CI `30313437508`, Browser E2E `30313437519`, Parity Documentation `30313437487` passed',
    '**Last completed exact-Head verification:** `5a2f545cf06f66fc494de8b23a8b330937dacd36`; CI `30317928641`, Browser E2E `30317928583`, Parity Documentation `30317928587` passed',
)
status = status.replace(
    '- This slice does not yet declare PAC complete: top-level arbitrary PAC activation, `auth.all`, nested PAC capability boundaries, and file activation remain pending.\n',
    '- The remote-source data plane is now paired with the verified top-level raw activation/authentication slice above; only file activation, locale, Firefox coverage, and real 407 manual QC remain.\n',
)
run_id = os.environ.get('SWITCH_INTERACTION_RUN_ID', 'PENDING')
insert_before = '### Attached Rule List lifecycle and background updates\n'
section = f'''### Switch source-mode persistence and drag ordering\n\n- Original v3.5.0 stores `editSource` separately under `web._profileEditor.<name>` and recomposes source from the current rules on restore. Nex now keeps the same separation using a stable Profile-ID localStorage key, so profile renames do not lose the editor mode and source text never enters UI-state storage.\n- Entering source mode stores the preference; successful exit clears it; parse failure keeps the user in source mode; compose failure safely returns to table mode.\n- Chromium E2E enters source mode, reloads and restores it, exits and verifies key cleanup, then performs a real drag-handle reorder and verifies visible order, typed Draft order, and reload persistence.\n- Integration run `{run_id}`; product commit containing this document.\n\n'''
if insert_before not in status:
    raise SystemExit('Milestone status Switch insertion anchor missing')
status = status.replace(insert_before, section + insert_before, 1)
status = status.replace(
    '- Switch source-editor localization, browser interaction coverage, and edit-mode persistence across reloads,\n- complete Switch localization and Chromium drag-order E2E,\n',
    '- complete Switch localization and source-editor error/confirmation locale coverage,\n',
)
status = status.replace(
    'Continue Switch localization/source-editor browser persistence, Virtual browser E2E, and complete localization; keep file PAC activation under an explicit target capability decision.',
    'Continue Virtual browser creation/reference-migration E2E and typed locale coverage; keep file PAC activation under an explicit target capability decision.',
)
status_path.write_text(status)
