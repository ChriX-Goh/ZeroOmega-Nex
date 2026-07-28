from pathlib import Path

m8 = Path('docs/MILESTONE_8_STATUS.md')
text = m8.read_text()
replacements = {
    '**Current product implementation head:** `a997f72054e26071a614d1db5ae8af1129098560` — Firefox optional-origin Rule Source/PAC downloads and read-only status race fix': '**Current product implementation head:** `c96ceb4a3a871951a23a58989df02dfe2689d1b8` — Bounded online backup restore with local compatibility review',
    '**Latest integration verification:** run `30399701709` validates permission denial/non-mutation, real Firefox optional-origin grants, Rule Source/PAC downloads, PAC activation, and the read-only status/mutation-lock race fix': '**Latest integration verification:** run `30402596911` validates secret-safe online download errors, local-review-only behavior, full repository verification, real Chromium download, and real Firefox optional-origin download',
    '**Last completed exact-Head verification:** `b63ddf960ea939b814cfee1ca40ef2361579888f`; CI `30399942785`, Browser E2E `30399942779`, Parity Documentation `30399942787` passed': '**Last completed exact-Head verification:** `fa24888c1410b94c2d018b7a86f6b79397058013`; CI `30402798827`, Browser E2E `30402798830`, Parity Documentation `30402798803` passed',
    '- Online URL restore, schema-v1 upgrade, and v1 AutoDetect migration remain separate missing/scope items.': '- Online URL restore, schema-v1 upgrade, and v1 AutoDetect migration were later closed by the source-backed slices recorded below.',
    '- This closes local import translation and startup activation. Online URL restore, schema-v1 upgrade, v1 AutoDetect migration, and repository-owner real complex-backup QC remain separate open items.': '- This closed local import translation and startup activation. Online URL restore and schema-v1/v1 AutoDetect migration were subsequently closed; repository-owner real complex-backup QC remains open.',
    '- The import-review audit is now closed for local files: compatibility summary, stable code/path technical details, secret-material warning, inactive import, immediate apply, byte-identical backup round trip, and direct typed locale coverage are all verified. Online URL restore remains a separate scope item.': '- The import-review audit is closed for local files: compatibility summary, stable code/path technical details, secret-material warning, inactive import, immediate apply, byte-identical backup round trip, and direct typed locale coverage are verified. The later online-restore slice extends the same review boundary to bounded HTTP(S) downloads.',
}
for old, new in replacements.items():
    if text.count(old) != 1:
        raise SystemExit(f'M8 checkpoint anchor mismatch: {old[:90]}')
    text = text.replace(old, new)
m8.write_text(text)

status = Path('docs/MILESTONE_STATUS.md')
text = status.read_text()
old_scope = '''- Original schema-v2 Options `.bak` export and browser export → clear → restore → byte-identical export round trip.
- Virtual reference migration, general Replace Profile dialog, typed deletion protection, and profile-level PAC/Rule List exports.
- Warning-fatal Svelte checks with zero current warnings.
- Typed English, Simplified Chinese, and Traditional Chinese catalog for New Profile, lifecycle dialogs, Fixed, Switch, Attached Rule List, Independent Rule List, route labels, dynamic messages, and ARIA.
- Machine-generated locale inventory and permanent parity/localization guards.
'''
new_scope = '''- Original schema-v2 Options `.bak` export and browser export → clear → restore → byte-identical export round trip.
- Original schema-v1 → v2 upgrade, referenced `auto_detect` → WPAD PAC migration, and disabled sync-runtime cleanup.
- File, pasted JSON/base64, and bounded online HTTP(S) backup review with explicit inactive or immediate-Apply import actions.
- Virtual reference migration, general Replace Profile dialog, typed deletion protection, and profile-level PAC/Rule List exports.
- Warning-fatal Svelte checks with zero current warnings.
- Direct typed English, Simplified Chinese, and Traditional Chinese presentation across normal Options, profiles, Popup, Temporary Rules, Network, Import, History, Theme, lifecycle dialogs, dynamic messages, and ARIA.
- Machine-generated locale inventory with zero untranslated user-visible candidates plus permanent parity/localization guards.
'''
if text.count(old_scope) != 1:
    raise SystemExit('project status delivered-scope anchor mismatch')
text = text.replace(old_scope, new_scope)
old_blockers = '''- Complete typed PAC editor localization and Firefox PAC interaction/activation/download coverage.
- Explicit modern target decision for `file:` PAC activation.
- Real proxy-challenge manual QC and stable downloader failure codes.
- Remaining General, Interface, Import, Theme, History, Popup, Temporary Rules, and Network localization.
- Online URL restore and final scope decisions for Gist, WebDAV, and browser sync.
- Consolidated light/dark/zh-CN/zh-TW visual evidence.
- Repository-owner real complex backup and final installable-candidate acceptance.
- Recheck Milestone 8 delivery-plan obligations that are not yet clearly closed, especially user-visible snapshot history/rollback UI and complete import-review behavior.
'''
new_blockers = '''- Explicit first-release scope decisions for Gist, WebDAV, and browser-native sync.
- Real proxy-challenge manual QC.
- Consolidated light/dark/zh-CN/zh-TW visual evidence.
- Repository-owner real complex backup and final installable-candidate acceptance.
'''
if text.count(old_blockers) != 1:
    raise SystemExit('project status blocker anchor mismatch')
text = text.replace(old_blockers, new_blockers)
old_direction = '''The next product slice is the PAC typed-localization batch using the fixed v3.5.0 PAC templates and locale evidence. It covers URL/Clear, remote headers, download/cache state, script text, `auth.all`, file warnings/errors, actions, placeholders, titles, and ARIA, plus Firefox PAC interaction coverage.
'''
new_direction = '''The remaining automated scope decision is to classify Gist, WebDAV, and browser-native sync independently. Each requires an explicit ADR covering secret ownership, remote conflict semantics, browser quotas/capabilities, first-release scope, and any later milestone. After those decisions, Milestone 8 moves to consolidated visual evidence, real proxy-challenge QC, repository-owner complex-backup acceptance, and formal candidate preparation.
'''
if text.count(old_direction) != 1:
    raise SystemExit('project status direction anchor mismatch')
status.write_text(text.replace(old_direction, new_direction))
