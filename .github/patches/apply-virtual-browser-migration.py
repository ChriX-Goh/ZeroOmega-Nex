from pathlib import Path
import json
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


fixture = {
    'schemaVersion': 2,
    '-enableQuickSwitch': True,
    '-refreshOnProfileChange': False,
    '-startupProfileName': 'Target Proxy',
    '-quickSwitchProfiles': ['Target Proxy', 'Existing Alias', 'direct'],
    '-revertProxyChanges': True,
    '-confirmDeletion': True,
    '-showInspectMenu': True,
    '-addConditionsToBottom': False,
    '-showResultProfileOnActionBadgeText': False,
    '-showExternalProfile': True,
    '-downloadInterval': 1440,
    '+target-proxy': {
        'name': 'Target Proxy',
        'profileType': 'FixedProfile',
        'color': '#64b5f6',
        'revision': 'virtual-target',
        'fallbackProxy': {
            'scheme': 'http',
            'host': 'target.proxy.invalid',
            'port': 8080,
        },
        'bypassList': [],
    },
    '+unrelated-proxy': {
        'name': 'Unrelated Proxy',
        'profileType': 'FixedProfile',
        'color': '#e57373',
        'revision': 'virtual-unrelated',
        'fallbackProxy': {
            'scheme': 'http',
            'host': 'unrelated.proxy.invalid',
            'port': 8081,
        },
        'bypassList': [],
    },
    '+route-matrix': {
        'name': 'Route Matrix',
        'profileType': 'SwitchProfile',
        'color': '#8bc34a',
        'revision': 'virtual-switch',
        'defaultProfileName': 'Target Proxy',
        'rules': [
            {
                'condition': {
                    'conditionType': 'HostWildcardCondition',
                    'pattern': '*.virtual-migration.invalid',
                },
                'profileName': 'Target Proxy',
                'note': 'Virtual migration rule',
            }
        ],
    },
    '+rule-matrix': {
        'name': 'Rule Matrix',
        'profileType': 'RuleListProfile',
        'color': '#ffee99',
        'revision': 'virtual-rule-list',
        'format': 'Switchy',
        'matchProfileName': 'Target Proxy',
        'defaultProfileName': 'Target Proxy',
        'ruleList': '[SwitchyOmega Conditions]\n@with result\n\n*.virtual-migration.invalid +Target Proxy\n* +Target Proxy\n',
    },
    '+pac-matrix': {
        'name': 'PAC Matrix',
        'profileType': 'PacProfile',
        'color': '#ffb74d',
        'revision': 'virtual-pac',
        'pacScript': "function FindProxyForURL(url, host) { return 'DIRECT'; }\n",
        'fallbackProfileName': 'Target Proxy',
    },
    '+auto-matrix': {
        'name': 'Auto Matrix',
        'profileType': 'AutoDetectProfile',
        'color': '#4db6ac',
        'revision': 'virtual-auto',
        'pacUrl': 'http://wpad/wpad.dat',
        'pacScript': "function FindProxyForURL(url, host) { return 'DIRECT'; }\n",
        'fallbackProfileName': 'Target Proxy',
    },
    '+existing-alias': {
        'name': 'Existing Alias',
        'profileType': 'VirtualProfile',
        'color': '#9575cd',
        'revision': 'virtual-existing-alias',
        'defaultProfileName': 'Target Proxy',
    },
}
Path('fixtures/zeroomega-v2/virtual-reference-migration.json').write_text(
    json.dumps(fixture, ensure_ascii=False, indent=2) + '\n'
)

# Stable browser hooks for the real create + migration workflow.
replace_once(
    'apps/extension/src/entrypoints/options/App.svelte',
    '''        <button
          class:active={activeSection === 'new-profile'}
          type="button"
''',
    '''        <button
          class:active={activeSection === 'new-profile'}
          data-new-profile-action
          type="button"
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
    '''              type="radio"
              name="profile-type"
              value={choice.kind}
''',
    '''              type="radio"
              name="profile-type"
              value={choice.kind}
              data-new-profile-kind={choice.kind}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/NewProfileDialog.svelte',
    '''      <button type="button" class="primary" disabled={!canCreate} on:click={create}>
''',
    '''      <button
        type="button"
        class="primary"
        data-new-profile-create
        disabled={!canCreate}
        on:click={create}
      >
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
    '  <section class="settings-section">\n',
    '  <section class="settings-section" data-virtual-profile-editor>\n',
)
replace_once(
    'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
    '''      aria-label="Virtual Profile target"
      value={routeValue(profile.targetRoute)}
''',
    '''      aria-label="Virtual Profile target"
      data-virtual-target
      value={routeValue(profile.targetRoute)}
''',
)
replace_once(
    'apps/extension/src/entrypoints/options/VirtualProfileEditor.svelte',
    '''      type="button"
      disabled={disabled || profile.targetRoute.kind !== 'profile'}
      on:click={replaceTargetReferences}>Replace target profile</button
''',
    '''      type="button"
      data-virtual-replace
      disabled={disabled || profile.targetRoute.kind !== 'profile'}
      on:click={replaceTargetReferences}>Replace target profile</button
''',
)

# Strengthen the typed replacement test to every supported reference-bearing profile kind.
replace_once(
    'packages/profile-workflow/src/profile-operations.test.ts',
    '''    expect(validateProfileSpec(replaced).valid).toBe(true);
  });
});
''',
    '''    expect(validateProfileSpec(replaced).valid).toBe(true);
  });

  it('rewrites every supported reference surface and keeps both endpoint profiles unchanged', () => {
    const source = workflowFixture();
    const created = createVirtualProfileDraft(source, deterministicIds(), 'Stable Alias');
    const virtual = created.draft.profiles.find((profile) => profile.id === created.profileId);
    if (!virtual || virtual.kind !== 'virtual') throw new Error('virtual profile missing');
    virtual.targetRoute = { kind: 'profile', profileId: 'profile-primary' };
    created.draft.profiles.push(
      {
        id: 'profile-switch-matrix',
        name: 'Switch Matrix',
        kind: 'switch',
        rules: [
          {
            id: 'rule-matrix',
            condition: { kind: 'host-wildcard', pattern: '*.virtual.invalid' },
            route: { kind: 'profile', profileId: 'profile-primary' },
          },
        ],
        defaultRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
      {
        id: 'profile-rule-matrix',
        name: 'Rule Matrix',
        kind: 'rule-list',
        sourceId: 'source-rule-matrix',
        matchRoute: { kind: 'profile', profileId: 'profile-primary' },
        defaultRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
      {
        id: 'profile-pac-matrix',
        name: 'PAC Matrix',
        kind: 'pac',
        source: { kind: 'inline', script: "function FindProxyForURL() { return 'DIRECT'; }" },
        fallbackRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
      {
        id: 'profile-auto-matrix',
        name: 'Auto Matrix',
        kind: 'auto-detect',
        fallbackRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
      {
        id: 'profile-existing-alias',
        name: 'Existing Alias',
        kind: 'virtual',
        targetRoute: { kind: 'profile', profileId: 'profile-primary' },
      },
    );
    created.draft.ruleSources.push({
      id: 'source-rule-matrix',
      name: 'Rule Matrix source',
      format: 'switchy',
      location: { kind: 'inline', content: '[SwitchyOmega Conditions]\\n@with result\\n' },
    });
    created.draft.settings.startup.route = { kind: 'profile', profileId: 'profile-primary' };
    created.draft.settings.quickSwitch.routes = [
      { kind: 'profile', profileId: 'profile-primary' },
      { kind: 'profile', profileId: created.profileId },
      { kind: 'profile', profileId: 'profile-secondary' },
    ];

    const beforePrimary = structuredClone(
      created.draft.profiles.find((profile) => profile.id === 'profile-primary'),
    );
    const beforeVirtual = structuredClone(virtual);
    const replaced = replaceProfileReferencesDraft(
      created.draft,
      'profile-primary',
      created.profileId,
    );
    const route = { kind: 'profile', profileId: created.profileId } as const;

    expect(replaced.settings.startup.route).toEqual(route);
    expect(replaced.settings.quickSwitch.routes).toEqual([
      route,
      { kind: 'profile', profileId: 'profile-secondary' },
    ]);
    expect(replaced.profiles.find((profile) => profile.id === 'profile-switch-matrix')).toMatchObject({
      defaultRoute: route,
      rules: [expect.objectContaining({ route })],
    });
    expect(replaced.profiles.find((profile) => profile.id === 'profile-rule-matrix')).toMatchObject({
      matchRoute: route,
      defaultRoute: route,
    });
    expect(replaced.profiles.find((profile) => profile.id === 'profile-pac-matrix')).toMatchObject({
      fallbackRoute: route,
    });
    expect(replaced.profiles.find((profile) => profile.id === 'profile-auto-matrix')).toMatchObject({
      fallbackRoute: route,
    });
    expect(replaced.profiles.find((profile) => profile.id === 'profile-existing-alias')).toMatchObject({
      targetRoute: route,
    });
    expect(replaced.profiles.find((profile) => profile.id === 'profile-primary')).toEqual(beforePrimary);
    expect(replaced.profiles.find((profile) => profile.id === created.profileId)).toEqual(beforeVirtual);
    expect(validateProfileSpec(replaced).valid).toBe(true);
  });
});
''',
)

# Dedicated browser context: import a cross-profile original backup, create Virtual through UI,
# migrate references, Apply, and inspect the persisted typed graph.
replace_once(
    'scripts/e2e-chromium.mjs',
    "const legacyBackupPath = resolve('fixtures/zeroomega-v2/minimal-profile-types.json');\n",
    "const legacyBackupPath = resolve('fixtures/zeroomega-v2/minimal-profile-types.json');\nconst virtualMigrationBackupPath = resolve(\n  'fixtures/zeroomega-v2/virtual-reference-migration.json',\n);\n",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    "const conflictUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-conflict-user-'));\n",
    "const conflictUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-conflict-user-'));\nconst virtualUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-virtual-user-'));\n",
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''let context;
let conflictContext;
''',
    '''let context;
let conflictContext;
let virtualContext;
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  conflictContext = await chromium.launchPersistentContext(conflictUserDataDir, {
''',
    '''  virtualContext = await chromium.launchPersistentContext(virtualUserDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let [virtualWorker] = virtualContext.serviceWorkers();
  virtualWorker ??= await virtualContext.waitForEvent('serviceworker', { timeout: 15_000 });
  const virtualOptions = await virtualContext.newPage();
  await virtualOptions.goto(`chrome-extension://${extensionId}/options.html`);
  await virtualOptions.waitForLoadState('domcontentloaded');
  await virtualOptions.locator('[data-new-profile-action]').waitFor({ timeout: 20_000 });
  await virtualOptions.getByRole('button', { name: '导入 / 导出', exact: true }).click();
  await virtualOptions.getByLabel('原版备份文件').setInputFiles(virtualMigrationBackupPath);
  await virtualOptions.getByRole('heading', { name: '兼容性检查', exact: true }).waitFor();
  await virtualOptions.getByRole('button', { name: '导入并立即使用', exact: true }).click();
  await virtualOptions
    .getByText('导入完成，原版配置现已启用。')
    .waitFor({ state: 'visible', timeout: 20_000 });

  await virtualOptions.locator('[data-new-profile-action]').click();
  const newVirtualDialog = virtualOptions.locator('.new-profile-dialog');
  await newVirtualDialog.waitFor({ state: 'visible', timeout: 20_000 });
  await newVirtualDialog.locator('.profile-name-field input').fill('Stable Alias');
  await newVirtualDialog.locator('[data-new-profile-kind="virtual"]').check();
  await newVirtualDialog.locator('[data-new-profile-create]').click();
  const virtualEditor = virtualOptions.locator('[data-virtual-profile-editor]');
  await virtualEditor.waitFor({ state: 'visible', timeout: 20_000 });
  const virtualTarget = virtualEditor.locator('[data-virtual-target]');
  await virtualTarget.selectOption({ label: 'Target Proxy' });
  const virtualIds = await assertEventuallyValue(async () => {
    return virtualWorker.evaluate(async () => {
      const key = 'zeroomega-nex/profile-workflow/v1/state';
      const workflow = (await chrome.storage.local.get(key))[key];
      const target = workflow?.draft?.profiles?.find((profile) => profile.name === 'Target Proxy');
      const alias = workflow?.draft?.profiles?.find((profile) => profile.name === 'Stable Alias');
      if (
        target?.kind !== 'fixed' ||
        alias?.kind !== 'virtual' ||
        alias.targetRoute?.kind !== 'profile' ||
        alias.targetRoute.profileId !== target.id
      ) {
        return undefined;
      }
      return { targetId: target.id, aliasId: alias.id };
    });
  }, 'Virtual target selection did not reach the Draft');

  virtualOptions.once('dialog', (dialog) => dialog.accept());
  await virtualEditor.locator('[data-virtual-replace]').click();
  await assertEventually(
    async () =>
      virtualWorker.evaluate(
        async ({ targetId, aliasId }) => {
          const key = 'zeroomega-nex/profile-workflow/v1/state';
          const workflow = (await chrome.storage.local.get(key))[key];
          const draft = workflow?.draft;
          if (!draft) return false;
          const routeMatches = (route) => route?.kind === 'profile' && route.profileId === aliasId;
          const target = draft.profiles.find((profile) => profile.id === targetId);
          const alias = draft.profiles.find((profile) => profile.id === aliasId);
          const routeMatrix = draft.profiles.find((profile) => profile.name === 'Route Matrix');
          const ruleMatrix = draft.profiles.find((profile) => profile.name === 'Rule Matrix');
          const pacMatrix = draft.profiles.find((profile) => profile.name === 'PAC Matrix');
          const autoMatrix = draft.profiles.find((profile) => profile.name === 'Auto Matrix');
          const existingAlias = draft.profiles.find((profile) => profile.name === 'Existing Alias');
          const aliasQuickRoutes = draft.settings.quickSwitch.routes.filter(
            (route) => route.kind === 'profile' && route.profileId === aliasId,
          );
          return (
            target?.kind === 'fixed' &&
            alias?.kind === 'virtual' &&
            alias.targetRoute?.kind === 'profile' &&
            alias.targetRoute.profileId === targetId &&
            routeMatches(draft.settings.startup.route) &&
            aliasQuickRoutes.length === 1 &&
            !draft.settings.quickSwitch.routes.some(
              (route) => route.kind === 'profile' && route.profileId === targetId,
            ) &&
            routeMatrix?.kind === 'switch' &&
            routeMatches(routeMatrix.defaultRoute) &&
            routeMatrix.rules.every((rule) => routeMatches(rule.route)) &&
            ruleMatrix?.kind === 'rule-list' &&
            routeMatches(ruleMatrix.matchRoute) &&
            routeMatches(ruleMatrix.defaultRoute) &&
            pacMatrix?.kind === 'pac' &&
            routeMatches(pacMatrix.fallbackRoute) &&
            autoMatrix?.kind === 'auto-detect' &&
            routeMatches(autoMatrix.fallbackRoute) &&
            existingAlias?.kind === 'virtual' &&
            routeMatches(existingAlias.targetRoute)
          );
        },
        virtualIds,
      ),
    'Virtual reference migration did not rewrite every typed route surface',
    20_000,
  );
  const virtualApply = virtualOptions.locator('.nav-group.actions button.primary');
  await assertEventually(
    async () => !(await virtualApply.isDisabled()),
    'Virtual migration did not leave an applicable Draft',
  );
  await virtualApply.click();
  await assertEventually(
    async () =>
      virtualWorker.evaluate(async () => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        return (
          workflow !== undefined &&
          workflow.pendingApply === undefined &&
          JSON.stringify(workflow.draft) === JSON.stringify(workflow.applied)
        );
      }),
    'Virtual reference migration did not commit through normal Apply',
    20_000,
  );
  assert.equal(await virtualOptions.getByRole('button', { name: 'Target Proxy', exact: true }).count(), 1);
  assert.equal(await virtualOptions.getByRole('button', { name: 'Stable Alias', exact: true }).count(), 1);
  await virtualContext.close();
  virtualContext = undefined;

  conflictContext = await chromium.launchPersistentContext(conflictUserDataDir, {
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await conflictContext?.close();
  await context?.close();
''',
    '''  await conflictContext?.close();
  await virtualContext?.close();
  await context?.close();
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''  await rm(conflictUserDataDir, { recursive: true, force: true });
  await rm(conflictExtensionPath, { recursive: true, force: true });
''',
    '''  await rm(conflictUserDataDir, { recursive: true, force: true });
  await rm(virtualUserDataDir, { recursive: true, force: true });
  await rm(conflictExtensionPath, { recursive: true, force: true });
''',
)
replace_once(
    'scripts/e2e-chromium.mjs',
    '''async function assertEventually(check, message, timeout = 15_000) {
''',
    '''async function assertEventuallyValue(check, message, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const value = await check();
    if (value !== undefined) return value;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  assert.fail(message);
}

async function assertEventually(check, message, timeout = 15_000) {
''',
)

# Component contract and permanent guard.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    '''    expect(body).toContain('Virtual profiles keep a stable name');
''',
    '''    expect(body).toContain('data-virtual-profile-editor');
    expect(body).toContain('data-virtual-target');
    expect(body).toContain('data-virtual-replace');
    expect(body).toContain('Virtual profiles keep a stable name');
''',
)
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''      optionsApp.includes('onRegisterBeforeAction={registerBeforeProfileEditorAction}') &&
      switchSource.includes('export function composeSwitchProfileSource') &&
''',
    '''      optionsApp.includes('onRegisterBeforeAction={registerBeforeProfileEditorAction}') &&
      optionsApp.includes('data-new-profile-action') &&
      virtualProfile.includes('data-virtual-profile-editor') &&
      virtualProfile.includes('data-virtual-target') &&
      virtualProfile.includes('data-virtual-replace') &&
      profileOperations.includes('replaceProfileReferencesDraft') &&
      chromiumE2e.includes('virtual-reference-migration.json') &&
      chromiumE2e.includes('Virtual reference migration did not rewrite every typed route surface') &&
      chromiumE2e.includes('Virtual reference migration did not commit through normal Apply') &&
      switchSource.includes('export function composeSwitchProfileSource') &&
''',
)

# Source-backed durable docs.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(
    kg_path.read_text()
    + '''
- 原版 `profile_virtual.jade` 提供 Target Profile selector 与 Replace Profile 操作；`master.coffee` 先执行 `applyOptionsConfirm()`，确认后调用 target `replaceRef(fromName,toName)`。`Options#_replaceRefChanges` 明确跳过 from/to 两个 Profile 本体，改写其他 Profile 内引用、Startup，并按避免重复的规则处理 Quick Switch；两个端点都不删除。
- Nex 保留 typed Draft/Apply 不变量：Virtual shortcut 只生成一次完整 Draft 引用迁移，用户再走正常 Apply；不会直接改 Applied 或浏览器代理。当前 typed Quick Switch 采用“映射后去重”，比原版“目标已存在则不改 Quick Switch”更积极，这是为稳定 route ID 与无重复列表保留的已记录安全差异。
- Chromium 独立用户目录从原版 schema-v2 备份恢复跨类型引用图，通过真实 New Profile 模态框创建 Virtual、选择目标、确认 Replace，再验证 Startup、Quick Switch、Switch default/rules、Rule List match/default、PAC/Auto Detect fallback、其他 Virtual target 全部迁移，同时源 Profile 与新 Virtual 本体保持不变，最后经正常 Apply 提交。
'''
)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
audit = audit_path.read_text()
audit = audit.replace(
    '| F-09 | Virtual 编辑页         | `profile_virtual.jade`                   | 目标 selector + 帮助               | MUST_MATCH | DONE     | COMPLETE | 新增真实 Virtual 类型、目标选择器和帮助                                                                              | 增加浏览器 E2E                |',
    '| F-09 | Virtual 编辑页         | `profile_virtual.jade`                   | 目标 selector + 帮助               | MUST_MATCH | DONE     | COMPLETE | 真实 Virtual 类型、目标选择器和帮助；Chromium 通过 New Profile 模态框创建并选择目标                                  | 保持双浏览器回归              |',
)
audit = audit.replace(
    '| F-10 | Virtual 引用替换       | `profile_virtual.jade`、`profile.coffee` | 用目标替换所有 Virtual 引用        | MUST_MATCH | DONE     | PARTIAL  | 已有排除目标/Virtual 本身的 typed 引用替换和去重                                                                     | 补确认文案翻译与复杂引用测试  |',
    '| F-10 | Virtual 引用替换       | `profile_virtual.jade`、`master.coffee`、`options.coffee` | 用 Virtual 替换目标的全部引用；两个端点不变 | MUST_MATCH | DONE     | PARTIAL  | typed 事务覆盖 Startup、Quick Switch、Switch、Rule List、PAC/Auto Detect fallback 与其他 Virtual；Chromium 创建/确认/Apply 全链验证；Quick Switch 映射后去重为已记录安全差异 | 补确认文案翻译                |',
)
audit = audit.replace(
    '| J-04 | 四类原版新建流程 E2E               | MUST_MATCH | PARTIAL  | 已有组件渲染与后端类型测试，尚缺真实浏览器创建四类                                                                         | 增加 Chromium/Firefox E2E        |',
    '| J-04 | 四类原版新建流程 E2E               | MUST_MATCH | PARTIAL  | Chromium 已真实创建 Virtual；Fixed/Switch/PAC 普通新建仍主要由组件与后端覆盖                                                | 补其余三类双浏览器创建          |',
)
audit = audit.replace(
    '| J-08 | Virtual 引用 E2E                   | MUST_MATCH | PARTIAL  | ProfileSpec、解释器、PAC、迁移、引用替换已有单元/组件覆盖                                                                  | 增加真实浏览器 E2E               |',
    '| J-08 | Virtual 引用 E2E                   | MUST_MATCH | DONE     | 单元测试覆盖全部 typed 引用面；Chromium 独立上下文验证原版备份恢复→真实创建→目标选择→确认迁移→正常 Apply，并保持两个端点不变 | 保持回归                         |',
)
audit_path.write_text(audit)

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
status = status.replace(
    '**Last completed exact-Head verification:** `5a2f545cf06f66fc494de8b23a8b330937dacd36`; CI `30317928641`, Browser E2E `30317928583`, Parity Documentation `30317928587` passed',
    '**Last completed exact-Head verification:** `0c38408c3fa11fbac76eb55623057aac01e63461`; CI `30318764139`, Browser E2E `30318764071`, Parity Documentation `30318764078` passed',
)
run_id = os.environ.get('VIRTUAL_BROWSER_RUN_ID', 'PENDING')
insert_before = '### Attached Rule List lifecycle and background updates\n'
section = f'''### Virtual creation and complete reference migration\n\n- Original Virtual uses a target selector and a Replace Profile confirmation; replacement leaves both endpoint profiles intact while rewriting other profile references and global routes.\n- Nex performs this as one typed Draft transformation followed by the normal verified Apply transaction. Unit coverage now includes Startup, Quick Switch de-duplication, Switch rules/default, Rule List match/default, PAC/Auto Detect fallback, and other Virtual targets.\n- Chromium uses a separate user data directory, restores a source-backed schema-v2 cross-reference fixture, creates `Stable Alias` through the real four-type New Profile dialog, selects `Target Proxy`, confirms migration, verifies every typed route surface and both endpoint profiles, then commits through Apply.\n- Integration run `{run_id}`; product commit containing this document.\n\n'''
if insert_before not in status:
    raise SystemExit('Milestone status Virtual insertion anchor missing')
status = status.replace(insert_before, section + insert_before, 1)
status = status.replace(
    '- Virtual browser E2E creation and reference-migration coverage,\n',
    '',
)
status = status.replace(
    'Continue Virtual browser creation/reference-migration E2E and typed locale coverage; keep file PAC activation under an explicit target capability decision.',
    'Continue typed locale coverage, profile deletion/reference protection, and profile-level export actions; keep file PAC activation under an explicit target capability decision.',
)
status_path.write_text(status)
