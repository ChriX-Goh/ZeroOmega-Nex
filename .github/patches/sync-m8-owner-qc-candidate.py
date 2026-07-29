from pathlib import Path

CANDIDATE_ID = 'M8-OWNER-QC-1'
CANDIDATE_HEAD = '46b10285b25ab0a0d7faae4d4822d5f4c3492a2a'
ARTIFACT_ID = '8725915254'
OUTER_SHA = '190dda95001cc381be4e2f9f95b7146314632ab8d3d87893347df9f994935b4c'
INNER_SHA = '1a3dffc3748c1c9479edbfa3be9769e49fded037717052fd151898ba3c86def3'


def append_once(path: Path, marker: str, addition: str) -> None:
    text = path.read_text()
    if marker in text:
        return
    path.write_text(text.rstrip() + '\n\n' + addition.strip() + '\n')


matrix = Path('docs/UI_AUDIT_MATRIX.md')
text = matrix.read_text()
marker = f'> Owner-QC candidate: `{CANDIDATE_ID}`'
if marker not in text:
    anchor = '> 本表是 Milestone 8 的用户界面与功能验收主表。原版基准固定为 `zero-peak/ZeroOmega v3.5.0`。状态必须基于源码、真实浏览器或真实备份，不得凭“看起来类似”判定。\n'
    if text.count(anchor) != 1:
        raise SystemExit(f'UI matrix introduction matches: {text.count(anchor)}')
    candidate_note = f'''\n> Owner-QC candidate: `{CANDIDATE_ID}`  
> Candidate Head: `{CANDIDATE_HEAD}`  
> Artifact: `browser-builds` ID `{ARTIFACT_ID}`  
> QC state: `NOT RUN`; all `MUST_MATCH` rows are `DONE`, while A-14 and I-11 remain non-blocking `REFERENCE` rows.\n'''
    matrix.write_text(text.replace(anchor, anchor + candidate_note))

append_once(
    Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md'),
    f'## Milestone 8 owner-QC candidate `{CANDIDATE_ID}`',
    f'''## Milestone 8 owner-QC candidate `{CANDIDATE_ID}`

- Candidate identity is immutable: Head `{CANDIDATE_HEAD}`, Artifact `browser-builds` ID `{ARTIFACT_ID}`.
- Outer GitHub Artifact ZIP SHA-256: `{OUTER_SHA}`.
- Inner `browser-builds.tar.gz` SHA-256: `{INNER_SHA}`.
- Package layout is `browser-builds/chrome-mv3` plus `browser-builds/firefox-mv3`; both are Manifest V3 version `0.0.1`.
- Exact-head CI, Chromium, Firefox, headed native Inspect, parity, and 24-image visual evidence passed before freeze.
- Canonical matrix is `DONE=124`, `PARTIAL=2`; no release-blocking `MUST_MATCH` row remains.
- A-14 exact skin and I-11 exact Popup pixels remain non-blocking visual references evaluated during owner QC.
- QC state is `NOT RUN`; candidate declaration is not release acceptance.
- Owner QC must use a real complex backup and record visual parity, authenticated routing, permission denial, restart recovery, rollback, and whether failed/cancelled operations changed traffic.
- Any defect stays attached to this exact candidate; replacement requires a new Head, full automation, fresh artifact identity, and a new candidate ID.''',
)

append_once(
    Path('docs/MILESTONE_8_SESSION_7_CHECKPOINT.md'),
    f'## Consolidated owner-QC candidate freeze — `{CANDIDATE_ID}`',
    f'''## Consolidated owner-QC candidate freeze — `{CANDIDATE_ID}`

- Product integration run `30456527030` produced product Head `23272bd9efc4abbcec5ca99c86d31a1353714e8b` and removed all temporary Switch-condition machinery.
- Human-authored candidate Head `{CANDIDATE_HEAD}` passed CI `30456863674`, Browser E2E `30456863926`, Parity `30456863775`, and Visual Evidence `30456863885`.
- The initial exact-head Chromium attempt hit the existing external-Profile popup timing race; the unchanged-job rerun passed. Firefox and native Inspect passed.
- Candidate Artifact `browser-builds` ID `{ARTIFACT_ID}` was independently downloaded and archive-tested.
- Outer ZIP SHA-256 `{OUTER_SHA}` matches GitHub Actions; inner tarball SHA-256 is `{INNER_SHA}`.
- Matrix state is `DONE=124`, `PARTIAL=2`, with no release-blocking `MUST_MATCH` row.
- Candidate QC state remains `NOT RUN`; PR #11 remains Draft.
- Next step is repository-owner QC on this exact artifact, not additional feature work or an untracked rebuild.''',
)

status = Path('docs/MILESTONE_8_STATUS.md').read_text()
candidate = Path('docs/MILESTONE_8_RELEASE_CANDIDATE.md').read_text()
for label, body in [('status', status), ('candidate', candidate)]:
    for expected in [CANDIDATE_ID, CANDIDATE_HEAD, ARTIFACT_ID, OUTER_SHA, INNER_SHA]:
        if expected not in body:
            raise SystemExit(f'{label} document missing candidate identity token: {expected}')

print('Synchronized Milestone 8 owner-QC candidate metadata across matrix, knowledge graph, and Session checkpoint.')
