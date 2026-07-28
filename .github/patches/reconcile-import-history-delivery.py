from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}: {old[:140]!r}')
    return text.replace(old, new, 1)


audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
rows = {
    'G-02': '| G-02 | 本地备份恢复 | 同上 | 文件选择后完整 reset | MUST_MATCH | DONE | PARTIAL | 文件优先选择、自动分析、显式“导入并立即使用/仅导入”、秘密抽离均已实现；Chromium 清空 local/session 后恢复并要求再次导出字节等价；仓库所有者真实复杂备份仍属最终 QC | typed locale 与真实复杂备份验收 |',
    'G-04': '| G-04 | JSON 对象/字符串 | `options.coffee#parseOptions` | 均接受 | MUST_MATCH | DONE | N/A | `decodeZeroOmegaBackup(input: string | unknown)` 明确接受对象或字符串；对象输入、JSON 文本及完整 importer 测试均覆盖 | 保持边界测试 |',
    'G-05': '| G-05 | Base64 JSON | 同上 | 非 `{` 字符串先 base64 decode | MUST_MATCH | DONE | N/A | `decodeBase64` 有大小/字符/UTF-8/JSON 边界；单测把完整 schema-v2 fixture 编码为 base64 并通过全迁移管线 | 保持 fixture |',
    'G-06': '| G-06 | schemaVersion 2 | `options.coffee#upgrade` | 直接接受 | MUST_MATCH | DONE | N/A | 固定原版 v3.5.0 生成 fixture、代表性 v2、跨引用 fixture、浏览器导入启用及 export→clear→import→export 字节等价均通过 | 保持 provenance 与浏览器回归 |',
    'G-09': '| G-09 | 恢复后 startup 应用 | `options.coffee#reset` | init 后应用 startupProfile | MUST_MATCH | PARTIAL | N/A | “导入并立即使用”先接受 Draft 再走正常 verified Apply；Chromium 验证导入配置已启用。尚缺针对非默认 imported startup route 的浏览器 ownership/startRoute 专项断言 | 增加 imported startup route E2E |',
    'G-10': '| G-10 | 导入错误分类 | `io.coffee` | 格式错误/下载错误分开 | MUST_MATCH | PARTIAL | PARTIAL | decoder/importer 已提供稳定 code/path 与 compatibility technical details；UI 仍直接渲染部分英文 message，在线下载错误路径尚未实现 | typed 错误映射与 URL 范围决定 |',
}
seen = set()
for index, line in enumerate(lines):
    if not line.startswith('| '):
        continue
    parts = line.split('|')
    if len(parts) < 3:
        continue
    row_id = parts[1].strip()
    if row_id in rows:
        lines[index] = rows[row_id]
        seen.add(row_id)
missing = set(rows) - seen
if missing:
    raise SystemExit(f'audit rows not found: {sorted(missing)}')
audit_path.write_text('\n'.join(lines) + '\n')

kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg = kg_path.read_text().rstrip()
section = r'''

## Delivery-plan reconciliation — Import review and Snapshot History

- `LegacyImportPanel` is not a missing placeholder. It implements file-first `.bak/.json/.txt` selection, optional pasted JSON/base64 text, non-activating compatibility analysis, encoding/profile/endpoint/rule-source/credential totals, status buckets, technical item details, background secret extraction, explicit `Import and use now`, and `Import without activating`.
- Selecting a file invokes analysis only. `Import and use now` first accepts the imported candidate into Draft and then uses the ordinary verified `apply` command; `Import without activating` leaves Applied/browser traffic unchanged. Chromium uploads an original backup, activates it, clears both local and session storage, restores the exported backup, and requires byte-identical schema-v2 output.
- Decoder support is source-backed and tested for object input, JSON text, base64 JSON, bounded size/depth/nodes/profile/rule counts, cyclic objects, invalid encodings, and unsafe fixtures. Therefore the old matrix claims that object/base64/schema-v2 were unverified or broken were stale and have been corrected.
- `SnapshotHistoryPanel` is also a real user-facing implementation rather than a missing page. It lists redacted immutable revision metadata and verified PAC snapshot metadata, marks Applied/Active/Last-known-good, displays target/capability/compiler/hash/verification vectors/stats/warnings, blocks rollback while Draft is dirty or source revision is missing, and requires a second destructive confirmation before rollback.
- Rollback remains a background transaction: prepare archived snapshot/revision, install/verify, commit Applied and Draft together, and restore prior browser state if workflow commit fails. Command tests cover successful activation, unavailable service, and browser-restore failure reporting.
- Remaining work for these pages is typed en/zh-CN/zh-TW text, stable user-facing error mapping, visual evidence, an explicit imported non-default startup-route browser assertion, and repository-owner real complex-backup acceptance. Online URL restoration and schema-v1 upgrade are separate open obligations; they are not evidence that the existing local review/history pages are missing.
'''
if section.strip() not in kg:
    kg_path.write_text(kg + section + '\n')

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
marker = '\n## Automated acceptance state\n'
reconciliation = r'''

### Delivery-plan reconciliation: Import review and Snapshot History

- The user-visible import review is implemented: file-first selection, optional pasted JSON/base64, compatibility summary and technical details, safe secret extraction, explicit activate/non-activate actions, and no traffic change during selection or analysis.
- Object, JSON string, base64 JSON, and schema-v2 support have direct decoder/importer tests. Chromium verifies original backup upload, explicit activation, full storage clear, restore, and byte-identical re-export. The old `BROKEN/UNVERIFIED` G-04/G-05/G-06 statuses were stale and are corrected.
- Snapshot History is implemented with redacted revisions and verified PAC snapshots, Applied/Active/Last-known-good state, verification metadata/warnings, dirty-Draft and missing-revision blockers, and a two-step rollback confirmation. Background command tests cover commit and browser-restore failure paths.
- These pages do not need a functional rebuild. Their open work is typed three-locale rendering, stable error presentation, visual evidence, a non-default imported startup-route browser assertion, and repository-owner real complex-backup acceptance.
- Online URL restore, schema-v1 upgrade, and v1 AutoDetect migration remain separate missing/scope items and are not conflated with local import review completeness.
'''
if reconciliation.strip() not in status:
    if status.count(marker) != 1:
        raise SystemExit('status automated acceptance marker missing')
    status = status.replace(marker, reconciliation + marker, 1)
old_next = 'Reconcile the remaining Milestone 8 delivery-plan obligations before another broad locale batch. Audit the user-visible import review and snapshot history/rollback UI against the fixed source baseline and current implementation, classify each row as implemented, missing, or an explicit scope decision, then implement the first missing `MUST_MATCH` slice. Continue General/Interface/Import/History/Popup/Temporary Rules/Network typed localization from the resulting closure order.'
new_next = 'Migrate `LegacyImportPanel` and `SnapshotHistoryPanel` as the next typed three-locale vertical batch. Cover import/export actions, compatibility status labels and totals, technical details, safe error summaries, revision/snapshot metadata, verification labels, warnings, dirty/missing-revision blockers, rollback confirmation, titles, placeholders, options and ARIA. Add a Chromium assertion for an imported non-default startup route; keep online URL restore and schema-v1 upgrade as separate scope/implementation decisions.'
status = replace_once(status, old_next, new_next, 'status next action')
status_path.write_text(status)
