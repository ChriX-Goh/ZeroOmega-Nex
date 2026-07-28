from pathlib import Path

path = Path('docs/MILESTONE_8_STATUS.md')
text = path.read_text()
replacements = {
    '**Current product implementation head:** `4bb42febeb4bd51f434a4e381f91a9df6b2daf12` — Typed Options shell, General and Interface':
        '**Current product implementation head:** `0f8c95eb9e92495a0551be2bb357428a10af7fc3` — Typed Theme and Popup',
    '**Latest integration verification:** run `30381058967` validates typed Options navigation, Actions status, General/Interface settings, safe App-level errors, fresh locale inventory, full repository verification, and the complete Chromium interaction chain':
        '**Latest integration verification:** run `30382975947` validates typed Theme and Popup in three locales, safe Popup errors, fresh locale inventory, full repository verification, and the complete Chromium popup interaction chain',
    '**Last completed exact-Head verification:** `14ced5045ae8b8338ad9d12c06c72061d869f892`; CI `30381284751`, Browser E2E `30381284926`, Parity Documentation `30381285016` passed':
        '**Last completed exact-Head verification:** `4fb93193d089809dc107cf6d77ba41b9ee42b58b`; CI `30383219144`, Browser E2E `30383224211`, Parity Documentation `30383219516` passed',
    '- Chromium verifies resolved zh-CN Theme and Popup locale, shared dark/automatic theme behavior, result selection, temporary-rule session storage, current-site Apply, external import, and ownership blocking through the complete interaction chain.':
        '- Chromium verifies resolved zh-CN Theme and Popup locale, shared dark/automatic theme behavior, result selection, temporary-rule session storage, current-site Apply, external import, and ownership blocking through the complete interaction chain.\n- Integration run `30382975947`; product commit `0f8c95eb9e92495a0551be2bb357428a10af7fc3`; clean exact Head `4fb93193d089809dc107cf6d77ba41b9ee42b58b` passed CI `30383219144`, Browser E2E `30383224211`, and Parity Documentation `30383219516`. The typed inventory now covers twelve components and reports 117 remaining candidates.',
}
for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'checkpoint anchor count {count}: {old[:120]!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
