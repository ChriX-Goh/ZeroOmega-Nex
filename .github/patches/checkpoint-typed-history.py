from pathlib import Path


def replace_once(pathname: str, old: str, new: str) -> None:
    path = Path(pathname)
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{pathname}: expected one match, found {count}: {old[:180]!r}')
    path.write_text(text.replace(old, new, 1))


path = 'docs/MILESTONE_8_STATUS.md'
replace_once(
    path,
    '**Current product implementation head:** `c1eb5ea58aec1a8b8fb9ded42633f1ef13e1e185` — Typed PAC three-locale editor and Firefox top-level raw-PAC interaction  \n**Latest integration verification:** run `30372528930` validates the typed PAC catalog/editor, original `auth.all` warnings, safe localized failures, fresh locale inventory, full repository verification, Chromium remote PAC workflows, and Firefox inline PAC create/apply/activate behavior  \n**Last completed exact-Head verification:** `623728119dbbcaddc9fd97e608d034c5fd35003f`; CI `30372828416`, Browser E2E `30372828089`, Parity Documentation `30372828051` passed  ',
    '**Current product implementation head:** `19ed3d66b52be16366842912f0461cd203e1a825` — Typed Snapshot History and real Chromium atomic rollback  \n**Latest integration verification:** run `30375459826` validates typed History in three locales, import-delivery reconciliation, fresh locale inventory, full repository verification, and a real Chromium rollback that converges browser, Applied, Draft, and UI state  \n**Last completed exact-Head verification:** `b3d54fc266f7472cecca336022f75f56652b84e5`; CI `30375737690`, Browser E2E `30375737649`, Parity Documentation `30375737656` passed  ',
)
replace_once(
    path,
    '- The import-review audit confirmed the existing compatibility summary, technical migration details, secret-material warning, inactive import, immediate apply, and byte-identical backup round trip; its remaining gap is direct typed locale coverage rather than missing workflow behavior.\n',
    '- The import-review audit confirmed the existing compatibility summary, technical migration details, secret-material warning, inactive import, immediate apply, and byte-identical backup round trip; its remaining gap is direct typed locale coverage rather than missing workflow behavior.\n- Integration run `30375459826`; product commit `19ed3d66b52be16366842912f0461cd203e1a825`; clean exact Head `b3d54fc266f7472cecca336022f75f56652b84e5` passed CI `30375737690`, Browser E2E `30375737649`, and Parity Documentation `30375737656`. The typed inventory now covers nine components and reports 229 remaining candidates.\n',
)
