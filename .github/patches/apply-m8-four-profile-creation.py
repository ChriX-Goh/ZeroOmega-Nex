from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new))


e2e = Path('scripts/e2e-chromium.mjs')
text = e2e.read_text()

replace_pairs = [
    (
        """const virtualUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-virtual-user-'));
const conflictExtensionPath = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-conflict-ext-'));
""",
        """const virtualUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-virtual-user-'));
const creationUserDataDir = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-creation-user-'));
const conflictExtensionPath = await mkdtemp(resolve(tmpdir(), 'zeroomega-nex-conflict-ext-'));
""",
        'creation user-data directory',
    ),
    (
        """let context;
let conflictContext;
let virtualContext;
""",
        """let context;
let conflictContext;
let virtualContext;
let creationContext;
""",
        'creation context declaration',
    ),
    (
        """  await virtualContext.close();
  virtualContext = undefined;

  conflictContext = await chromium.launchPersistentContext(conflictUserDataDir, {
""",
        """  await virtualContext.close();
  virtualContext = undefined;

  creationContext = await chromium.launchPersistentContext(creationUserDataDir, {
    channel: 'chromium',
    headless: true,
    locale: 'zh-CN',
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
  });
  let [creationWorker] = creationContext.serviceWorkers();
  creationWorker ??= await creationContext.waitForEvent('serviceworker', { timeout: 15_000 });
  const creationExtensionId = new URL(creationWorker.url()).host;
  assert.match(
    creationExtensionId,
    /^[a-p]{32}$/u,
    'Four-profile creation extension ID was not resolved',
  );
  const creationOptions = await creationContext.newPage();
  await creationOptions.goto(`chrome-extension://${creationExtensionId}/options.html`);
  await creationOptions.waitForLoadState('domcontentloaded');
  await creationOptions.locator('[data-new-profile-action]').waitFor({
    state: 'visible',
    timeout: 20_000,
  });

  const createNormalProfile = async ({ name, kind, editor }) => {
    await creationOptions.locator('[data-new-profile-action]').click();
    const dialog = creationOptions.locator('.new-profile-dialog');
    await dialog.waitFor({ state: 'visible', timeout: 20_000 });
    const nameInput = dialog.locator('[data-new-profile-name-input]');
    await assertEventually(
      async () => nameInput.evaluate((element) => element === document.activeElement),
      `${name} dialog did not focus the profile-name field`,
    );
    await nameInput.fill(name);
    const kindInput = dialog.locator(`[data-new-profile-kind="${kind}"]`);
    await kindInput.check();
    assert.equal(await kindInput.isChecked(), true, `${name} kind was not selected`);
    await dialog.locator('[data-new-profile-create]').click();
    await dialog.waitFor({ state: 'detached', timeout: 20_000 });
    const profileNameInput = creationOptions.getByLabel('情景模式名称');
    await profileNameInput.waitFor({ state: 'visible', timeout: 20_000 });
    assert.equal(await profileNameInput.inputValue(), name);
    await editor().waitFor({ state: 'visible', timeout: 20_000 });
  };

  await createNormalProfile({
    name: 'Created Fixed',
    kind: 'fixed',
    editor: () => creationOptions.locator('[data-fixed-proxy-table]'),
  });
  await createNormalProfile({
    name: 'Created Switch',
    kind: 'switch',
    editor: () => creationOptions.locator('[data-switch-rules-table]'),
  });
  await createNormalProfile({
    name: 'Created PAC',
    kind: 'pac',
    editor: () =>
      creationOptions.locator('[data-pac-profile-editor][data-typed-locale="zh-CN"]'),
  });
  await createNormalProfile({
    name: 'Created Virtual',
    kind: 'virtual',
    editor: () =>
      creationOptions.locator('[data-virtual-profile-editor][data-typed-locale="zh-CN"]'),
  });
  await creationOptions
    .getByLabel('虚拟情景模式目标', { exact: true })
    .selectOption({ label: 'Created Fixed' });

  const createdProfileIds = await assertEventuallyValue(async () => {
    return creationWorker.evaluate(async () => {
      const key = 'zeroomega-nex/profile-workflow/v1/state';
      const workflow = (await chrome.storage.local.get(key))[key];
      const names = ['Created Fixed', 'Created Switch', 'Created PAC', 'Created Virtual'];
      const profiles = Object.fromEntries(
        names.map((name) => [name, workflow?.draft?.profiles?.find((profile) => profile.name === name)]),
      );
      if (
        profiles['Created Fixed']?.kind !== 'fixed' ||
        profiles['Created Switch']?.kind !== 'switch' ||
        profiles['Created PAC']?.kind !== 'pac' ||
        profiles['Created Virtual']?.kind !== 'virtual' ||
        profiles['Created Virtual'].targetRoute?.kind !== 'profile' ||
        profiles['Created Virtual'].targetRoute.profileId !== profiles['Created Fixed'].id
      ) {
        return undefined;
      }
      return Object.fromEntries(
        Object.entries(profiles).map(([name, profile]) => [name, profile.id]),
      );
    });
  }, 'The four normal New Profile flows did not converge in Draft');
  assert.deepEqual(Object.keys(createdProfileIds).sort(), [
    'Created Fixed',
    'Created PAC',
    'Created Switch',
    'Created Virtual',
  ]);

  const creationApply = creationOptions.getByRole('button', { name: '应用选项', exact: true });
  await assertEventually(
    async () => !(await creationApply.isDisabled()),
    'Four-profile creation did not leave an applicable Draft',
  );
  await creationApply.click();
  await assertEventually(
    async () =>
      creationWorker.evaluate(async (expectedIds) => {
        const key = 'zeroomega-nex/profile-workflow/v1/state';
        const workflow = (await chrome.storage.local.get(key))[key];
        if (
          !workflow ||
          workflow.pendingApply !== undefined ||
          JSON.stringify(workflow.draft) !== JSON.stringify(workflow.applied)
        ) {
          return false;
        }
        return Object.entries(expectedIds).every(([name, id]) =>
          workflow.applied.profiles.some((profile) => profile.id === id && profile.name === name),
        );
      }, createdProfileIds),
    'The four normal New Profile flows did not commit through normal Apply',
    20_000,
  );
  await creationContext.close();
  creationContext = undefined;

  conflictContext = await chromium.launchPersistentContext(conflictUserDataDir, {
""",
        'four-profile creation browser chain',
    ),
    (
        """  await conflictContext?.close();
  await virtualContext?.close();
  await context?.close();
""",
        """  await conflictContext?.close();
  await creationContext?.close();
  await virtualContext?.close();
  await context?.close();
""",
        'creation context cleanup',
    ),
    (
        """  await rm(conflictUserDataDir, { recursive: true, force: true });
  await rm(virtualUserDataDir, { recursive: true, force: true });
  await rm(conflictExtensionPath, { recursive: true, force: true });
""",
        """  await rm(conflictUserDataDir, { recursive: true, force: true });
  await rm(virtualUserDataDir, { recursive: true, force: true });
  await rm(creationUserDataDir, { recursive: true, force: true });
  await rm(conflictExtensionPath, { recursive: true, force: true });
""",
        'creation user-data cleanup',
    ),
]

for old, new, label in replace_pairs:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    text = text.replace(old, new)
e2e.write_text(text)

# Close J-04 only after the unified real-browser chain exists in the product script.
audit = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith('| J-04 |'):
        lines[index] = '| J-04 | 四类原版新建流程 E2E               | MUST_MATCH | DONE     | Chromium 在独立全新工作区内依次通过真实 New Profile 模态框创建 Fixed、Switch、PAC、Virtual，逐类验证专属编辑器、Draft 类型、Virtual→Fixed 目标及最终正常 Apply 收敛 | 保持统一创建链回归           |'
        break
else:
    raise SystemExit('J-04 audit row was not found')
for index, line in enumerate(lines):
    if line.startswith('- **仍开放的 MUST_MATCH：6 项。**'):
        lines[index] = '- **仍开放的 MUST_MATCH：5 项。** A-12 PAC unsupported 能力接线、B-03 Rename 对话框、C-09 协议能力矩阵、D-04 条件类型矩阵、D-05 条件字段矩阵。'
        if index + 1 < len(lines) and lines[index + 1].startswith('- **UNCERTAIN'):
            pass
        break
else:
    raise SystemExit('open MUST_MATCH summary was not found')
# Remove the former duplicated six-item detail line when present.
lines = [
    line
    for line in lines
    if not line.startswith('- **仍开放的 MUST_MATCH：6 项。** A-12')
]
update_anchor = '| 2026-07-29 | 修正 parity 状态列统计和陈旧台账；矩阵收敛为 6 个 MUST_MATCH、1 个 UNCERTAIN、2 个非阻断 REFERENCE 开放项                    |'
if update_anchor not in lines:
    raise SystemExit('matrix update-record anchor was not found')
anchor_index = lines.index(update_anchor)
lines.insert(
    anchor_index + 1,
    '| 2026-07-29 | 完成独立全新 Chromium 工作区内 Fixed/Switch/PAC/Virtual 四类统一 New Profile 创建、专属编辑器、Draft 与 Apply 闭环；开放 MUST_MATCH 降至 5 项 |',
)
audit.write_text('\n'.join(lines) + '\n')

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
replace_once(
    status,
    '- Fixed, Switch, PAC, and Virtual as the four normal creation types.\n',
    '- Fixed, Switch, PAC, and Virtual as the four normal creation types, with one isolated Chromium chain creating all four through the real New Profile dialog and committing them through normal Apply.\n',
    'M8 delivered four-type creation',
)
text = status.read_text()
replace_once(
    status,
    '- complete real-browser creation coverage for all four normal profile types;\n',
    '',
    'M8 remove four-type blocker',
)
status.write_text(status.read_text())

checkpoint = Path('docs/MILESTONE_8_SESSION_7_CHECKPOINT.md')
text = checkpoint.read_text()
replace_once(
    checkpoint,
    '- The reconciled matrix retains six `MUST_MATCH` gaps: target-dependent PAC-disable wiring, Rename-dialog parity, protocol capability matrix, Switch condition-type matrix, Switch condition-field matrix, and unified four-type browser creation E2E.\n',
    '- The reconciled matrix now retains five `MUST_MATCH` gaps: target-dependent PAC-disable wiring, Rename-dialog parity, protocol capability matrix, Switch condition-type matrix, and Switch condition-field matrix.\n',
    'checkpoint open rows',
)
text = checkpoint.read_text()
insert_anchor = '### Control-plane reconciliation and cleanup\n'
section = '''### Unified four-type New Profile browser acceptance

- Chromium opens a separate fresh extension profile with no imported fixture state.
- The real New Profile dialog creates `Created Fixed`, `Created Switch`, `Created PAC`, and `Created Virtual` in sequence.
- Each creation must select the requested radio kind, close the dialog, select the new profile, and render its type-specific editor.
- The Virtual profile is pointed at the newly created Fixed profile; typed Draft state must contain the four exact kinds and reference.
- The complete Draft commits through the normal Apply transaction and converges with Applied state.
- J-04 is DONE; the release-blocking `MUST_MATCH` count falls from six to five.

'''
if checkpoint.read_text().count(insert_anchor) != 1:
    raise SystemExit('checkpoint insertion anchor mismatch')
checkpoint.write_text(checkpoint.read_text().replace(insert_anchor, section + insert_anchor))

# Record the durable evidence relationship.
graph = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
graph.write_text(
    graph.read_text()
    + '''\n### Unified normal-profile creation acceptance

- J-04 is accepted only as one isolated real-browser chain rather than a union of unrelated tests.
- A fresh Chromium user-data directory opens the actual New Profile dialog four times and creates Fixed, Switch, PAC, and Virtual in sequence.
- Every creation verifies the selected type, selected profile name, type-specific editor, and typed Draft record.
- Virtual additionally targets the newly created Fixed profile. The final normal Apply must make Draft and Applied byte-equivalent while retaining all four IDs and kinds.
- This chain complements, rather than replaces, the deeper per-type Fixed, Switch, PAC, and Virtual workflows elsewhere in Chromium and Firefox E2E.
'''
)

validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
insert_anchor = "requireAll('Chromium real proxy challenge', chromiumE2e, [\n"
extra = """requireAll('unified four-profile creation', chromiumE2e, [
  "creationUserDataDir",
  "name: 'Created Fixed'",
  "name: 'Created Switch'",
  "name: 'Created PAC'",
  "name: 'Created Virtual'",
  "The four normal New Profile flows did not converge in Draft",
  "The four normal New Profile flows did not commit through normal Apply",
]);

const fourProfileRow = audit.split('\\n').find((line) => line.startsWith('| J-04 '));
if (!fourProfileRow || !fourProfileRow.includes('| DONE') || !fourProfileRow.includes('Chromium')) {
  failures.push('J-04 must remain DONE with unified Chromium creation evidence');
}

"""
if text.count(insert_anchor) != 1:
    raise SystemExit('validator four-profile insertion anchor mismatch')
validator.write_text(text.replace(insert_anchor, extra + insert_anchor))
