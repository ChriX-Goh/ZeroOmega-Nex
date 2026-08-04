from pathlib import Path
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


evidence_path = 'docs/AUDIT_EVIDENCE_02O_POPUP_RESULT_CONTROL_REMOVAL.md'
graph_path = 'docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md'

result = """

## Verified ordinary-Head result

Ordinary Head `04b2b8af27214324a94bad2371a0de9d8db0923e` passed all six permanent gates on the first run: CI, Browser E2E, Parity Documentation, Original Toolbar Evidence, Milestone 8 Visual Evidence and Original Nex UI Evidence.

Schema-3 artifact `8876162894` (`sha256:fee786254da6f6565c0a7054a0f0c5c6e40bdc699eca88b08221f0bcdd7e03b2`) proves:

- active Fixed text lines are identical in Original and Nex;
- active Switch text lines are identical in Original and Nex;
- both implementations record zero result controls in default, active Fixed and active Switch states;
- active Fixed and active Switch rows remain 31px high;
- the removed 29px Nex-only result editor does not return.

Chromium verifies the preserved background `set-popup-profile-result` command directly and retains the same atomic workflow/storage/snapshot assertions. Firefox, Chromium, native Inspect and every Toolbar specialist step pass. The ordinary Popup result-editor defect is therefore `VERIFIED_AUTOMATION`; complete Popup interactions and owner acceptance remain open.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
"""
evidence = Path(evidence_path).read_text()
if 'Ordinary Head `04b2b8af27214324a94bad2371a0de9d8db0923e` passed all six permanent gates' not in evidence:
    evidence += result
Path(evidence_path).write_text(evidence)

replace_once(
    graph_path,
    '  - result selectors, site actions, temporary rules, ownership blocking and Options entry;',
    '  - compact active-route presentation, site actions, temporary rules, ownership blocking and Options entry;\n  - result mutation remains in background/Options paths and is not exposed as a Nex-only ordinary Popup editor;',
)
replace_once(
    graph_path,
    '- result-selector provenance remains open;',
    '- non-default site, temporary-rule and ownership Popup surfaces remain open;',
)
replace_once(
    graph_path,
    '- expanded Popup states, result selectors, site actions, temporary rules and ownership surfaces;',
    '- expanded site-action, temporary-rule and ownership Popup surfaces;',
)
replace_once(
    graph_path,
    """### `KG-STARTUP-OWNERSHIP-001`
""",
    """### `KG-POPUP-RESULT-SURFACE-001`

Status: `VERIFIED_AUTOMATION` on ordinary Head `04b2b8af27214324a94bad2371a0de9d8db0923e`.

- official active Fixed and active Switch Popups keep the same compact five-line list as Nex;
- schema-3 paired metrics record zero result controls for default, active Fixed and active Switch states;
- active rows remain 31px high and the Nex-only 29px result editor is absent;
- Chromium exercises `set-popup-profile-result` directly through the background command boundary and preserves atomic workflow/storage/snapshot behavior;
- Firefox, Chromium, native Inspect and every Toolbar specialist step pass on the same ordinary Head;
- artifact `8876162894`, digest `fee786254da6f6565c0a7054a0f0c5c6e40bdc699eca88b08221f0bcdd7e03b2`.

This node closes the demonstrated ordinary result-editor invention in automation only. Site actions, temporary rules, ownership surfaces, complete Popup interaction parity and owner acceptance remain open.

### `KG-STARTUP-OWNERSHIP-001`
""",
)
replace_once(
    graph_path,
    '- `KG-POPUP-STRUCTURE-001` — `PARTIAL`; default text/order/geometry/icons verified, expanded states and complete interactions remain open.',
    '- `KG-POPUP-STRUCTURE-001` — `PARTIAL`; default text/order/geometry/icons and active result-surface absence verified, site/temporary/ownership states and complete interactions remain open.\n- `KG-POPUP-RESULT-SURFACE-001` — active Fixed/Switch result-editor absence plus background mutation capability `VERIFIED_AUTOMATION`.',
)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        evidence_path,
        graph_path,
    ],
    check=True,
)
subprocess.run(['pnpm', 'validate:parity-docs'], check=True)
subprocess.run(['git', 'diff', '--check'], check=True)
