from pathlib import Path

# Correct stale import-compatibility rows discovered during the delivery-plan audit.
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
kg = kg_path.read_text()
anchor = '## 15.5 Nex 已验证快照历史与回滚'
section = '''## 15.4 Nex 导入审阅现状\n\n- `LegacyImportPanel` 已实现本地文件优先选择、可选粘贴 JSON/base64、非激活兼容性分析、统计分类、技术明细、秘密材料抽离提示，以及“导入并立即使用/仅导入”两个明确动作。\n- 选择或分析备份不会改变浏览器流量。“导入并立即使用”先接受候选 Draft，再走普通 verified Apply；“仅导入”保持 Applied 与浏览器状态不变。\n- decoder/importer 已直接覆盖对象、JSON 字符串、base64 JSON、schemaVersion 2、资源边界、循环对象、非法编码和 unsafe fixture。旧矩阵中 G-04/G-05/G-06 的 `UNVERIFIED/BROKEN` 是状态漂移，不是当前实现事实。\n- Chromium 已执行原版备份上传、显式启用、清空 local/session、恢复导出备份与字节级再次导出。剩余缺口是 typed 三语、稳定用户错误映射、非默认 imported startup route 专项断言和仓库所有者真实复杂备份 QC。\n- 在线 URL 恢复、schema v1 升级和 v1 AutoDetect→WPAD PAC 仍是独立开放项，不能用它们否定本地导入审阅已实现，也不能把本地审阅完成误当作这些开放项完成。\n\n'''
if section.strip() not in kg:
    if kg.count(anchor) != 1:
        raise SystemExit('History knowledge-graph anchor missing')
    kg_path.write_text(kg.replace(anchor, section + anchor, 1))

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
marker = '### Typed Snapshot History and real rollback closure'
reconciliation = '''### Delivery-plan reconciliation: Import review\n\n- The user-visible import review was confirmed as implemented rather than a placeholder: file-first input, optional pasted JSON/base64, compatibility summary, technical details, safe secret extraction, explicit activate/non-activate actions, and no traffic change during selection or analysis.\n- Object, JSON string, base64 JSON, and schema-v2 support have direct decoder/importer tests. Chromium verifies original backup upload, explicit activation, full storage clear, restore, and byte-identical re-export.\n- The stale G-04/G-05/G-06 `UNVERIFIED/BROKEN` statuses are corrected. Remaining import-review work is typed three-locale rendering, stable error presentation, a non-default imported startup-route browser assertion, and repository-owner real complex-backup acceptance.\n- Online URL restore, schema-v1 upgrade, and v1 AutoDetect migration remain separate missing/scope items.\n\n'''
if reconciliation.strip() not in status:
    if status.count(marker) != 1:
        raise SystemExit('History status anchor missing')
    status_path.write_text(status.replace(marker, reconciliation + marker, 1))
