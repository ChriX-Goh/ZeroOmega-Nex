from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


path = 'docs/MILESTONE_8_STATUS.md'
replace_once(
    path,
    '**Current product implementation head:** `85ce92bd443591f94a11adce4191f8c648b4d0fc` — Typed Switch, Attached Rule List, and Independent Rule List three-locale vertical batch  \n**Latest integration verification:** run `30368429932` validates typed condition/help/source errors, attached and independent Rule List controls/status/ARIA, fresh locale inventory, zero Svelte warnings, full repository verification, dual-target builds, and real Chromium zh-CN workflows  \n**Last completed exact-Head verification:** `6998ddf6d42e646403856e0372943c2778b6ad7a`; CI `30368666864`, Browser E2E `30368666918`, Parity Documentation `30368666640` passed  ',
    '**Current product implementation head:** `c1eb5ea58aec1a8b8fb9ded42633f1ef13e1e185` — Typed PAC three-locale editor and Firefox top-level raw-PAC interaction  \n**Latest integration verification:** run `30372528930` validates the typed PAC catalog/editor, original `auth.all` warnings, safe localized failures, fresh locale inventory, full repository verification, Chromium remote PAC workflows, and Firefox inline PAC create/apply/activate behavior  \n**Last completed exact-Head verification:** `623728119dbbcaddc9fd97e608d034c5fd35003f`; CI `30372828416`, Browser E2E `30372828089`, Parity Documentation `30372828051` passed  ',
)
replace_once(
    path,
    '- PAC localization, Firefox activation/download coverage, real proxy-challenge manual QC, and explicit file-URL target decision,\n- stable Rule Source downloader failure codes for complete semantic error localization,\n- remaining General/Interface/Import/Theme/History/Popup/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,\n- online restore and Gist/WebDAV/browser sync remain explicitly `UNCERTAIN`,',
    '- Firefox remote-origin permission/download coverage, real proxy-challenge manual QC, and an explicit `file:` PAC target decision,\n- stable Rule Source/PAC downloader failure codes for complete semantic error localization,\n- remaining General/Interface/Import/Theme/History/Popup/Temporary Rules/Network Simplified and Traditional Chinese coverage tracked by `docs/LOCALE_INVENTORY.json`,\n- online restore and Gist/WebDAV/browser sync remain explicitly `UNCERTAIN`,\n- consolidated light/dark/zh-CN/zh-TW visual evidence and repository-owner real complex-backup acceptance,',
)
replace_once(
    path,
    'Use `docs/LOCALE_INVENTORY.json` and the fixed v3.5.0 PAC locale/templates to migrate the PAC editor as the next typed vertical batch: URL/Clear, request headers, download/cache states, script text, authentication, file warnings, errors, titles, placeholders, and ARIA. Add Firefox PAC interaction coverage while keeping `file:` activation under an explicit target-capability decision.',
    'Reconcile the remaining Milestone 8 delivery-plan obligations before another broad locale batch. Audit the user-visible import review and snapshot history/rollback UI against the fixed source baseline and current implementation, classify each row as implemented, missing, or an explicit scope decision, then implement the first missing `MUST_MATCH` slice. Continue General/Interface/Import/History/Popup/Temporary Rules/Network typed localization from the resulting closure order.',
)
