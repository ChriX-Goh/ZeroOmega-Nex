from pathlib import Path

path = Path('docs/MILESTONE_8_STATUS.md')
text = path.read_text()
replacements = {
    '**Current product implementation head:** `b6dc3d0937296b91f83a917a74cfae6711318e08` — Typed Legacy Import and browser-confirmed imported startup activation':
        '**Current product implementation head:** `4bb42febeb4bd51f434a4e381f91a9df6b2daf12` — Typed Options shell, General and Interface',
    '**Latest integration verification:** run `30378560992` validates typed Legacy Import in three locales, safe code/path diagnostics, fresh locale inventory, full repository verification, schema-v2 byte-equivalent restoration, and browser-confirmed non-default startup activation':
        '**Latest integration verification:** run `30381058967` validates typed Options navigation, Actions status, General/Interface settings, safe App-level errors, fresh locale inventory, full repository verification, and the complete Chromium interaction chain',
    '**Last completed exact-Head verification:** `713079a86fe81aa8ae2c615ea52e2b98e5813e43`; CI `30378787419`, Browser E2E `30378787402`, Parity Documentation `30378787342` passed':
        '**Last completed exact-Head verification:** `14ced5045ae8b8338ad9d12c06c72061d869f892`; CI `30381284751`, Browser E2E `30381284926`, Parity Documentation `30381285016` passed',
    '- Chromium enters the real General and Interface pages, verifies zh-CN headings, labels, select/ARIA contracts and Actions state, and rejects legacy English template text. Existing Firefox zh-TW Apply and PAC paths remain mandatory.':
        '- Chromium enters the real General and Interface pages, verifies zh-CN headings, labels, select/ARIA contracts and Actions state, and rejects legacy English template text. Existing Firefox zh-TW Apply and PAC paths remain mandatory.\n- Integration run `30381058967`; product commit `4bb42febeb4bd51f434a4e381f91a9df6b2daf12`; clean exact Head `14ced5045ae8b8338ad9d12c06c72061d869f892` passed CI `30381284751`, Browser E2E `30381284926`, and Parity Documentation `30381285016`. The remaining literal-English inventory fell from 202 to 156 candidates.',
}
for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'checkpoint anchor count {count}: {old[:120]!r}')
    text = text.replace(old, new, 1)
path.write_text(text)
