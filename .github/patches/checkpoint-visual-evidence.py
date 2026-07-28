from pathlib import Path

m8 = Path('docs/MILESTONE_8_STATUS.md')
text = m8.read_text()
replacements = {
    '**Current product implementation head:** `c96ceb4a3a871951a23a58989df02dfe2689d1b8` — Bounded online backup restore with local compatibility review': '**Current product implementation head:** `1eb20d1d57cc53887d5d53df7963b8e85709ea24` — Exact-Head consolidated visual-evidence workflow and artifact',
    '**Latest integration verification:** run `30402596911` validates secret-safe online download errors, local-review-only behavior, full repository verification, real Chromium download, and real Firefox optional-origin download': '**Latest integration verification:** run `30407422010` validates the permanent capture script, four locale/theme combinations, six representative surfaces, 24 PNGs, image hashes, manifest generation, and full repository verification',
    '**Last completed exact-Head verification:** `e71ef1d71baab380dc1e972eeb787108cef0f207`; CI `30403288077`, Browser E2E `30403287902`, Parity Documentation `30403287912` passed': '**Last completed exact-Head verification:** `1eb20d1d57cc53887d5d53df7963b8e85709ea24`; CI `30407814006`, Browser E2E `30407814062`, Parity Documentation `30407814058`, Visual Evidence `30407814012` passed',
    '- Chromium and Firefox use real HTTP backups and assert one request, local review, retained permission, and byte-for-byte unchanged workflow state before import. G-03 and G-10 are now DONE; Gist/WebDAV/browser sync remain separate UNCERTAIN scope.': '- Chromium and Firefox use real HTTP backups and assert one request, local review, retained permission, and byte-for-byte unchanged workflow state before import. G-03 and G-10 are DONE; Gist/WebDAV/browser sync were subsequently closed by ADR-016–018.',
    '- A green workflow establishes reproducible coverage only; repository-owner visual review remains required before a consolidated candidate can be accepted.': '- Exact-Head run `30407814012` produced artifact `m8-visual-evidence-1eb20d1d57cc53887d5d53df7963b8e85709ea24`, ID `8707237406`, artifact digest `sha256:c61b7ea58e8dccd59fb1e0a628af6b9fec2303a824ab070f730ed08d354e30f2`, and manifest digest `176dcfbbb0e1c152f8c16016be98c8ffd2ca78b46fe981e56e7ce422d2160206`. All 24 files were independently rehashed successfully. Repository-owner visual review remains required before a consolidated candidate can be accepted.',
    '- consolidated light/dark/zh-CN/zh-TW visual evidence and repository-owner real complex-backup acceptance,': '- repository-owner review of the consolidated visual artifact and real complex-backup acceptance,',
    'Prepare consolidated light/dark/zh-CN/zh-TW visual evidence, then stage real proxy-challenge and repository-owner complex-backup QC for one consolidated candidate.': 'Attempt to close the real proxy 407 challenge through controlled Chromium/Firefox E2E; then stage repository-owner visual and real complex-backup QC for one consolidated candidate.',
}
for old, new in replacements.items():
    if text.count(old) != 1:
        raise SystemExit(f'M8 visual checkpoint anchor mismatch: {old[:100]}')
    text = text.replace(old, new)
m8.write_text(text)

project = Path('docs/MILESTONE_STATUS.md')
text = project.read_text()
delivered_anchor = '- Machine-generated locale inventory with zero untranslated user-visible candidates plus permanent parity/localization guards.\n'
delivered = delivered_anchor + '- Exact-Head visual evidence: light/dark × zh-CN/zh-TW across Options General, Fixed Profile, Import/Export, Popup, Temporary Rules, and Network, with 24 per-image hashes plus artifact/manifest digests.\n'
if text.count(delivered_anchor) != 1:
    raise SystemExit('project delivered visual anchor mismatch')
text = text.replace(delivered_anchor, delivered)
text = text.replace('- Consolidated light/dark/zh-CN/zh-TW visual evidence.\n', '')
old_owner = '- Repository-owner real complex backup and final installable-candidate acceptance.\n'
new_owner = '- Repository-owner visual-artifact review, real complex backup, and final installable-candidate acceptance.\n'
if text.count(old_owner) != 1:
    raise SystemExit('project owner blocker anchor mismatch')
text = text.replace(old_owner, new_owner)
old_direction = 'ADR-016–018 close Gist, WebDAV, and browser-native sync for the first browser release. Milestone 8 now moves to consolidated light/dark/zh-CN/zh-TW visual evidence, real proxy-challenge QC, repository-owner complex-backup acceptance, and formal consolidated-candidate preparation.'
new_direction = 'The exact-Head visual matrix is generated and integrity-checked. Milestone 8 now attempts controlled Chromium/Firefox proxy-407 challenge coverage, then moves to repository-owner visual/complex-backup acceptance and formal consolidated-candidate preparation.'
if text.count(old_direction) != 1:
    raise SystemExit('project direction visual anchor mismatch')
project.write_text(text.replace(old_direction, new_direction))
