from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '''**Current product implementation head:** `f6ed558ad14e5be6a5a2565f236fc278817ab1b7` — Zero-warning accessible Options dialogs and deterministic initial focus  
**Latest integration verification:** run `30330515929` validates all seven former Svelte warnings are removed, warning-fatal checks, 414 core tests, 14 component tests, dual-target builds, and real Chromium dialog focus  
**Last completed exact-Head verification:** `65b8fe0741178c1053f9ff1680e7487dbf647dc5`; CI `30330704000`, Browser E2E `30330703868`, Parity Documentation `30330703871` passed  
''',
    '''**Current product implementation head:** `e0dec06345cf496ceb4a4ac18725223a8b3b0937` — Typed three-locale catalog, machine inventory, and first complete vertical localization batch  
**Latest integration verification:** run `30332516697` validates semantic typed keys, parameterized messages, fresh locale inventory, 417 core tests, 15 component tests, zero Svelte warnings, dual-target builds, and real Chromium zh-CN lifecycle workflows  
**Last completed exact-Head verification:** `999ec55f13529176c7032e2d7f40acd8383e03e5`; CI `30332908321`, Browser E2E `30332908331`, Parity Documentation `30332908361` passed  
''',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '''- `scripts/generate-locale-inventory.mjs` produces `docs/LOCALE_INVENTORY.json`; `validate:locale` blocks a stale inventory or literal-English regression in the completed batch and is part of `pnpm verify`.
''',
    '''- `scripts/generate-locale-inventory.mjs` produces `docs/LOCALE_INVENTORY.json`; `validate:locale` blocks a stale inventory or literal-English regression in the completed batch and is part of `pnpm verify`.
- Integration run `30332516697`; product commit `e0dec06345cf496ceb4a4ac18725223a8b3b0937`. The first clean Head exposed one stale Firefox zh-TW selector (`情景模式名稱`); the source-backed `情境模式名稱` selector was corrected in test commit `999ec55f13529176c7032e2d7f40acd8383e03e5`, which passed CI `30332908321`, Browser E2E `30332908331`, and Parity Documentation `30332908361`.
''',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '''- complete Switch localization and source-editor error/confirmation locale coverage,
- PAC localization, Firefox activation/download coverage, real proxy-challenge manual QC, and explicit file-URL target decision,
- complete Simplified/Traditional Chinese coverage,
''',
    '''- typed Switch plus Attached/Independent Rule List localization, including condition help, source-editor errors, update states, headers, actions, placeholders, and ARIA,
- PAC localization, Firefox activation/download coverage, real proxy-challenge manual QC, and explicit file-URL target decision,
- remaining General/Interface/Import/Theme/History/Popup/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,
''',
)
replace_once(
    'docs/MILESTONE_8_STATUS.md',
    '''Continue typed locale coverage; keep file PAC activation under an explicit target capability decision. Do not request repository-owner installation until a consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.
''',
    '''Use `docs/LOCALE_INVENTORY.json` to migrate Switch plus Attached/Independent Rule List as the second typed vertical batch; keep file PAC activation under an explicit target capability decision. Do not request repository-owner installation until a consolidated candidate is explicitly declared with a fresh artifact digest and QC checklist.
''',
)
