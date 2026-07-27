from pathlib import Path
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:160]!r}')
    target.write_text(text.replace(old, new, 1))


# Component rendering contract.
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    """        deviceId: 'device-component-test',
        onAcceptImport: async () => true,""",
    """        deviceId: 'device-component-test',
        onPrepareExport: async () => baseSpec(),
        onAcceptImport: async () => true,""",
)
replace_once(
    'apps/extension/src/component-rendering.component.spec.ts',
    """    expect(body).toContain('Restore original ZeroOmega / SwitchyOmega backup');
    expect(body).toContain('aria-label="Legacy backup file"');""",
    """    expect(body).toContain('Export options');
    expect(body).toContain('data-legacy-export');
    expect(body).toContain('Restore original ZeroOmega / SwitchyOmega backup');
    expect(body).toContain('aria-label="Legacy backup file"');""",
)

# Permanent source-level acceptance guard.
validator_path = Path('scripts/validate-ui-compatibility.mjs')
validator = validator_path.read_text()
replace_once(
    str(validator_path),
    """const browserE2eWorkflowPath = '.github/workflows/browser-e2e.yml';
""",
    """const browserE2eWorkflowPath = '.github/workflows/browser-e2e.yml';
const legacyExportPath = 'packages/legacy-zeroomega/src/export.ts';
const chromiumE2ePath = 'scripts/e2e-chromium.mjs';
const originalBackupProvenancePath =
  'fixtures/zeroomega-v2/original-default-v3.5.0.provenance.json';
""",
)
validator = validator_path.read_text()
replace_once(
    str(validator_path),
    """const [nativeInspectE2e, browserE2eWorkflow] = await Promise.all([
  readFile(nativeInspectE2ePath, 'utf8'),
  readFile(browserE2eWorkflowPath, 'utf8'),
]);
""",
    """const [
  nativeInspectE2e,
  browserE2eWorkflow,
  legacyExport,
  chromiumE2e,
  originalBackupProvenance,
] = await Promise.all([
  readFile(nativeInspectE2ePath, 'utf8'),
  readFile(browserE2eWorkflowPath, 'utf8'),
  readFile(legacyExportPath, 'utf8'),
  readFile(chromiumE2ePath, 'utf8'),
  readFile(originalBackupProvenancePath, 'utf8'),
]);
""",
)
validator = validator_path.read_text()
anchor = """  [
    popupStyle.includes("font-family: 'Segoe UI'"),"""
check = """  [
    legacyExport.includes("ZEROOMEGA_BACKUP_SCHEMA_VERSION = 2") &&
      legacyExport.includes("text/plain;charset=utf-8") &&
      legacyExport.includes('ZeroOmegaOptions-${timestamp(value)}.bak') &&
      legacyExport.includes('content: JSON.stringify(options)') &&
      legacyExport.includes('secret.proxy-credential-omitted') &&
      legacyExport.includes('secret.request-header-omitted') &&
      legacyImport.includes('data-legacy-export') &&
      legacyImport.includes('exportZeroOmegaBackup') &&
      optionsApp.includes('prepareLegacyExport') &&
      optionsApp.includes("action: 'apply'") &&
      optionsApp.includes('structuredClone(state.applied)') &&
      chromiumE2e.includes("waitForEvent('download')") &&
      chromiumE2e.includes('chrome.storage.local.clear()') &&
      chromiumE2e.includes('secondExportContent') &&
      chromiumE2e.includes('firstExportContent') &&
      originalBackupProvenance.includes('8625759489') &&
      originalBackupProvenance.includes(
        '8403e963325a5d4fcac10fd2f3c8dac246cb720afb24f322c827d5cf8ebfdd19',
      ),
    'Full Options export must use the original schema-v2 JSON/MIME/filename contract, omit secrets, apply Draft work first, preserve a pinned original-generated fixture, and pass export-clear-import-export Chromium E2E.',
  ],
"""
if validator.count(anchor) != 1:
    raise SystemExit('legacy export validator insertion anchor missing')
validator_path.write_text(validator.replace(anchor, check + anchor, 1))

# Knowledge graph.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(
    kg_path.read_text()
    + """
- 原版完整 Options 导出在 `IoCtrl.exportOptions` 中先执行 `applyOptionsConfirm()`；只有当前表单有效且未应用修改已成功 Apply 后，才对完整 Options 对象做深层 plain JSON 转换与 `JSON.stringify`。MIME 固定为 `text/plain;charset=utf-8`，文件名固定为 `ZeroOmegaOptions-<ISO 时间>.bak`。
- Nex 的 `.bak` 不得只是把 ProfileSpec 改后缀。导出器必须反向映射为原版 schemaVersion 2 根设置与 `+<profile name>` 对象，并保留 Fixed/Switch/PAC/Virtual/Rule List、路由、规则顺序、URL/inline cache、字面请求头和内置颜色。
- 普通备份禁止包含代理密码、secretRef 指向的请求头或敏感 header。导出器省略这些字段并生成可见兼容性警告；这优先于原版明文凭据导出行为。Nex-only 的 disabled、regex flags、PAC fallback 和 per-source interval 以原版可忽略的扩展字段保存，并在重新导入 Nex 时恢复。
- 真实原版 round-trip fixture 不是人工拼写：Actions 从固定 Artifact `8625759489` 校验 SHA-256 后执行原版 v3.5.0 `default_options.coffee`，再用原版同款 `JSON.stringify` 生成 `.bak`。浏览器验收执行导入→导出→清空 local/session storage→重新导入→再次导出，两个 JSON 必须字节一致。
"""
)

# Audit matrix.
audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
updates = {
    'G-01': "| G-01 | 完整 Options 导出          | `io.jade`、`io.coffee`        | plain JSON `.bak`，ISO 时间文件名 | MUST_MATCH | DONE       | PARTIAL | 原版 schema-v2 反向映射、Apply-before-export、原版 MIME/文件名、敏感凭据省略警告、永久守卫及 Chromium 下载验证已实现 | 补完整 locale 文案                  |",
    'G-02': "| G-02 | 本地备份恢复               | 同上                          | 文件选择后完整 reset              | MUST_MATCH | PARTIAL    | PARTIAL | 代表性 v2 与由固定原版源码实际生成的默认 `.bak` 均可恢复；浏览器已验证清空后重新导入；仍待用户真实复杂备份样本 | 收集真实复杂备份回归样本             |",
    'J-02': "| J-02 | 真实原版 `.bak` round-trip         | MUST_MATCH | DONE     | 固定 Artifact 中执行原版 v3.5.0 `default_options.coffee` 生成 fixture；单测与 Chromium export→clear→import→export 字节等价 | 保持 provenance 与永久守卫          |",
    'J-09': "| J-09 | 导出→清空→导入→等价                | MUST_MATCH | DONE     | Chromium 真实下载 `.bak`、清空 local/session storage、重新导入启用并再次导出；JSON 字节完全一致 | 保持 E2E                           |",
}
for key, replacement in updates.items():
    matches = [index for index, line in enumerate(lines) if line.startswith(f'| {key} ')]
    if len(matches) != 1:
        raise SystemExit(f'expected one audit row {key}, found {len(matches)}')
    lines[matches[0]] = replacement
for index, line in enumerate(lines):
    if line.startswith('- **明确 BROKEN**：'):
        lines[index] = '- **明确 BROKEN**：编辑器翻译仍不完整；Fixed 主编辑器与 Switch 规则表结构、完整 Options 导出和基础本地恢复已恢复。'
    if line.startswith('- **明确 MISSING**：'):
        lines[index] = '- **明确 MISSING**：在线恢复、单 Profile 导出；完整 Options `.bak` 与原版默认备份 round-trip 已自动验收；Virtual 浏览器创建 E2E 仍不完整。'
audit_path.write_text('\n'.join(lines) + '\n')

# Decision record.
decisions_path = Path('docs/DECISIONS.md')
decisions_path.write_text(
    decisions_path.read_text()
    + """

## 2026-07-28 — Ordinary `.bak` exports omit secret material

**Decision:** Full Options exports use the original ZeroOmega schema-v2 JSON, MIME, and filename contract, but proxy credentials, sensitive request-header values, secret references, sync credentials, and arbitrary secret-like metadata are excluded. The UI exposes compatibility warnings and the browser round-trip test asserts the downloaded file contains no secret markers.

**Reason:** Original v3.5.0 exported credentials as part of its plain Options object. Reproducing that behavior would violate the Nex secret-ownership boundary and create a portable plaintext credential bundle.

**Consequence:** Non-secret Options semantics round-trip through original-compatible `.bak` files. Credentials must be re-entered or migrated through a future explicit encrypted-secret workflow; ordinary backups are never that workflow.
"""
)

# Status checkpoint.
status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
integration_run = os.environ.get('INTEGRATION_RUN_ID', 'pending')
status = status.replace(
    "**Current product implementation head:** `944644f3d4588e70429de65224402d8bdc37863a`  ",
    "**Current product implementation head:** original-compatible Options export product commit containing this document  ",
)
status = status.replace(
    "**Latest integration verification:** run `30297644740` validates the real headed Chromium Inspect context-menu path with full `pnpm verify`, complete Chromium regression, and native-menu session/badge/title assertions  ",
    f"**Latest integration verification:** run `{integration_run}` validates original-compatible Options export, pinned original fixture, secret omission, and Chromium export→clear→import→export equivalence with full `pnpm verify` and browser regression  ",
)
insert_anchor = """### Bounded request diagnostics and network inspection
"""
export_section = f"""### Original-compatible Options export and backup round trip

- Export first commits the active editor and, when Draft differs from Applied, requires the same Apply transaction before producing a file.
- The download is a real ZeroOmega schema-v2 Options object, not a renamed ProfileSpec: plain `JSON.stringify`, MIME `text/plain;charset=utf-8`, and `ZeroOmegaOptions-<ISO>.bak` filename.
- Fixed, Switch, PAC, Virtual, Rule List, routes, rule order, inline/URL content, literal headers, global settings, and built-in colors map back to original fields. Nex-only disabled/flags/fallback/per-source interval values use ignored extension fields so Nex can restore them without breaking original import.
- Proxy credentials, sensitive request headers, sync credentials, secret references, and secret-like metadata are omitted with visible warnings.
- Fixture `original-default-v3.5.0.bak` is generated by executing the pinned original module from Artifact `8625759489`, not manually authored.
- Unit tests cover representative and original-generated round trips plus secret omission. Chromium downloads the backup, clears local/session storage, restores it through the UI, exports again, and requires byte-identical JSON.
- Integration run `{integration_run}`; product commit containing this document.

"""
if status.count(insert_anchor) != 1:
    raise SystemExit('status export section insertion anchor missing')
status = status.replace(insert_anchor, export_section + insert_anchor, 1)
status = status.replace(
    "- full Options `.bak` export and a real original-backup semantic round trip,\n",
    "",
)
status = status.replace(
    "Implement full Options `.bak` export and a real original v3.5.0 export → reset → import semantic round trip, then continue the remaining profile/PAC/localization blockers.",
    "Rebuild the dedicated imported Rule List and PAC download/update/read-only/authentication semantics, then continue Virtual browser coverage and complete localization.",
)
status_path.write_text(status)
