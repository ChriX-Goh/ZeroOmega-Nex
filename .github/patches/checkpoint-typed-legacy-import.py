from pathlib import Path

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
replacements = {
    '**Current product implementation head:** `19ed3d66b52be16366842912f0461cd203e1a825` — Typed Snapshot History and real Chromium atomic rollback':
        '**Current product implementation head:** `b6dc3d0937296b91f83a917a74cfae6711318e08` — Typed Legacy Import and browser-confirmed imported startup activation',
    '**Latest integration verification:** run `30375459826` validates typed History in three locales, import-delivery reconciliation, fresh locale inventory, full repository verification, and a real Chromium rollback that converges browser, Applied, Draft, and UI state':
        '**Latest integration verification:** run `30378560992` validates typed Legacy Import in three locales, safe code/path diagnostics, fresh locale inventory, full repository verification, schema-v2 byte-equivalent restoration, and browser-confirmed non-default startup activation',
    '**Last completed exact-Head verification:** `b3d54fc266f7472cecca336022f75f56652b84e5`; CI `30375737690`, Browser E2E `30375737649`, Parity Documentation `30375737656` passed':
        '**Last completed exact-Head verification:** `713079a86fe81aa8ae2c615ea52e2b98e5813e43`; CI `30378787419`, Browser E2E `30378787402`, Parity Documentation `30378787342` passed',
    '- This closes local import translation and startup activation. Online URL restore, schema-v1 upgrade, v1 AutoDetect migration, and repository-owner real complex-backup QC remain separate open items.':
        '- This closes local import translation and startup activation. Online URL restore, schema-v1 upgrade, v1 AutoDetect migration, and repository-owner real complex-backup QC remain separate open items.\n- Integration run `30378560992`; product commit `b6dc3d0937296b91f83a917a74cfae6711318e08`; clean exact Head `713079a86fe81aa8ae2c615ea52e2b98e5813e43` passed CI `30378787419`, Browser E2E `30378787402`, and Parity Documentation `30378787342`. The typed inventory now covers ten components and reports 202 remaining candidates.',
    '- The import-review audit confirmed the existing compatibility summary, technical migration details, secret-material warning, inactive import, immediate apply, and byte-identical backup round trip; its remaining gap is direct typed locale coverage rather than missing workflow behavior.':
        '- The import-review audit is now closed for local files: compatibility summary, stable code/path technical details, secret-material warning, inactive import, immediate apply, byte-identical backup round trip, and direct typed locale coverage are all verified. Online URL restore remains a separate scope item.',
    '- remaining General/Interface/Import/Theme/Popup/Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,':
        '- remaining General/Interface/Theme/Popup/Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,',
}
for old, new in replacements.items():
    if status.count(old) != 1:
        raise SystemExit(f'status checkpoint anchor count {status.count(old)}: {old[:100]!r}')
    status = status.replace(old, new, 1)
status_path.write_text(status)

audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
rows = {
    'H-02': '| H-02 | 简体中文 | `zh_CN` | 全 UI locale | MUST_MATCH | PARTIAL | PARTIAL | typed 已覆盖生命周期、Fixed、Switch/Rule List、PAC、History 与 Legacy Import；inventory 继续跟踪 General/Interface/Theme/Popup/Temporary Rules/Network | 继续 General/辅助页 |',
    'H-03': '| H-03 | 正體中文 | `zh_TW/zh_Hant` | 全 UI locale | MUST_MATCH | PARTIAL | PARTIAL | typed 使用原版 `情境模式/代理認證/PAC 指令碼` 术语，并覆盖 History 与 Legacy Import；Firefox 已验证 PAC 创建与激活 | 继续通用页面 |',
    'H-04': '| H-04 | 动态文本 | locale/controller | 状态变化后仍翻译 | MUST_MATCH | PARTIAL | PARTIAL | 生命周期、Switch parser、Rule List/PAC 更新、History 与 Legacy Import 统计/结果使用 typed 参数或稳定状态；Rule/PAC 下载底层错误码仍待统一 | 错误码化与剩余页面 |',
    'H-06': '| H-06 | placeholder/title/aria | locale/template | 一同翻译 | MUST_MATCH | PARTIAL | PARTIAL | 生命周期、Fixed、Switch/Rule List、PAC、History、Legacy Import 已直接 typed；Chromium zh-CN 与 Firefox zh-TW 断言覆盖 | 扩展自动 DOM 巡查 |',
    'H-07': '| H-07 | 错误和确认框 | locale/controller | 全部本地化 | MUST_MATCH | PARTIAL | PARTIAL | 生命周期、Fixed、Switch/PAC auth、History 与 Legacy Import 本地错误已 typed；Rule/PAC 下载底层错误码与其他页面仍待迁移 | 继续统一错误码翻译 |',
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
    raise SystemExit(f'localization rows not found: {sorted(missing)}')
audit_path.write_text('\n'.join(lines) + '\n')
