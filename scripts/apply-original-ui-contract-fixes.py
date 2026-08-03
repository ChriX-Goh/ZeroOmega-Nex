from pathlib import Path
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


kg_path = 'docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md'
status_path = 'docs/MILESTONE_8_STATUS.md'
icon_evidence_path = 'docs/AUDIT_EVIDENCE_02M_POPUP_ICON_COMPATIBILITY.md'

replace_once(
    kg_path,
    """Remaining presentation gaps:

- Options sidebar background, boundary, typography and vertical rhythm;
- Popup profile icons, row height, selected-state accent and Options entry icon;
- complete editor/dialog density and interaction audit.""",
    """Verified default-presentation subsets:

- `KG-OPTIONS-DEFAULT-LAYOUT-001` — default About sidebar, navigation, product, action, notice and license geometry: `VERIFIED_AUTOMATION`;
- `KG-POPUP-DEFAULT-GEOMETRY-001` — default Popup shell, rows, typography, selected state, separators and Options action: `VERIFIED_AUTOMATION`;
- `KG-POPUP-DEFAULT-ICONS-001` — clean-room default leading/trailing icons, wrench and active outline: `VERIFIED_AUTOMATION`.

Remaining presentation gaps:

- expanded Popup states, result selectors, site actions, temporary rules and ownership surfaces;
- Options profile editors, dialogs, validation timing and non-default density;
- complete cross-surface interaction and owner-acceptance audit.""",
)

replace_once(
    kg_path,
    """This closes the demonstrated automation defect but does not alter owner acceptance or project progress.

## 6. Order graph""",
    """This closes the demonstrated automation defect but does not alter owner acceptance or project progress.

### `KG-OPTIONS-DEFAULT-LAYOUT-001`

Status: `VERIFIED_AUTOMATION` on ordinary Head `816388cf5f019ebd44e758149f36d99fa2507193`.

- paired computed metrics align default About navigation, actions, notices and license geometry;
- sidebar background, boundary, typography and vertical rhythm match the official default surface;
- default content/text remains aligned except the truthful Nex version;
- this node does not cover profile editors, dialogs or validation behavior.

### `KG-POPUP-DEFAULT-GEOMETRY-001`

Status: `VERIFIED_AUTOMATION` on ordinary Head `d24da81362bb3f5c2382e156cb7bf39d54721231`.

- 430px content shell, four default actions, 14px/21px typography, 31px rows and compact separators align with Original;
- active outline, Options row and result-control absence match the default System state;
- this node does not cover expanded site/temporary/ownership/result-selector states.

### `KG-POPUP-DEFAULT-ICONS-001`

Status: `VERIFIED_AUTOMATION` on ordinary Head `cb58afaf10714d1ea7219f8871f511b06375cac2`.

- all leading icon boxes, trailing Direct/System globes and Options wrench retain original coordinates and 14px geometry;
- the evidence-selected mixed clean-room glyph set keeps the visually improved power/retweet/wrench paths and the better-performing transfer/globe paths;
- all six permanent gates passed on the first ordinary run;
- Chromium waited for persisted System activation and completed every specialist step without reruns.

These bounded nodes close the default-entry presentation defects in automation only. They do not close the complete journeys or owner acceptance.

## 6. Order graph""",
)

replace_once(
    kg_path,
    """- `KG-POPUP-STRUCTURE-001` — `PARTIAL`; default text/order converged, visual geometry and icons remain open.
- `KG-OPTIONS-STRUCTURE-001` — `PARTIAL`; hierarchy/default landing converged, presentation remains open.
- `KG-OPTIONS-ABOUT-001` — `PARTIAL`; text, links and product icon converged, exact styling remains open.""",
    """- `KG-POPUP-STRUCTURE-001` — `PARTIAL`; default text/order/geometry/icons verified, expanded states and complete interactions remain open.
- `KG-OPTIONS-STRUCTURE-001` — `PARTIAL`; default About hierarchy/layout verified, editors/dialogs and non-default interactions remain open.
- `KG-OPTIONS-ABOUT-001` — default content and layout subset `VERIFIED_AUTOMATION`; owner acceptance and adjacent Options surfaces remain open.
- `KG-OPTIONS-DEFAULT-LAYOUT-001` — paired default layout `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-GEOMETRY-001` — paired default geometry `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-ICONS-001` — paired clean-room icon subset `VERIFIED_AUTOMATION`.""",
)

replace_once(
    kg_path,
    """- remaining differences are predominantly presentation geometry, icons, typography and truthful version text.

The bounded entry correction and startup ownership repair are automated and exact-Head verified, but the complete comparison and owner acceptance remain open.""",
    """- default Options layout and default Popup geometry/icons are now paired and computed-metric verified;
- remaining differences are predominantly expanded-state coverage, editor/dialog density, glyph micro-detail and truthful version text.

The bounded default-entry correction and startup ownership repair are automated and exact-Head verified, but expanded surfaces, complete interactions and owner acceptance remain open.""",
)

replace_once(
    kg_path,
    """- `KG-POPUP-STRUCTURE-001` — Popup hierarchy/text converged; geometry/icons: `PARTIAL`.
- `KG-OPTIONS-STRUCTURE-001` — Options hierarchy/default entry converged; presentation: `PARTIAL`.
- `KG-STARTUP-OWNERSHIP-001` — serialized startup/external ownership: `VERIFIED_AUTOMATION`.""",
    """- `KG-POPUP-STRUCTURE-001` — default hierarchy/text/geometry/icons verified; expanded states: `PARTIAL`.
- `KG-OPTIONS-STRUCTURE-001` — default hierarchy/About layout verified; editors/dialogs: `PARTIAL`.
- `KG-OPTIONS-DEFAULT-LAYOUT-001` — default About presentation: `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-GEOMETRY-001` — default Popup geometry: `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-ICONS-001` — default Popup clean-room icons: `VERIFIED_AUTOMATION`.
- `KG-STARTUP-OWNERSHIP-001` — serialized startup/external ownership: `VERIFIED_AUTOMATION`.""",
)

replace_once(
    kg_path,
    """normal exact Head
  -> six permanent gates green on 92feff8c
  -> capture computed Original/Nex layout and typography metrics
  -> align Options sidebar background/boundary/type/vertical rhythm
  -> inspect paired screenshots and DOM again
  -> align Popup icons/rows/selected state/Options entry
  -> Firefox first
  -> Chromium confirmation
  -> expand paired surface inventory""",
    """default entry Heads 816388cf / d24da813 / cb58afaf
  -> six permanent gates green without reruns
  -> default Options layout verified
  -> default Popup geometry and icons verified
  -> expand paired evidence to active Fixed/Switch and site-action Popup states
  -> audit temporary-rule and ownership Popup surfaces
  -> capture original profile-editor/dialog density
  -> Firefox first
  -> Chromium confirmation
  -> owner acceptance only after the expanded journey closes""",
)

replace_once(
    status_path,
    """These slices correct direction and close demonstrated automation defects but do not justify increasing progress. Paired evidence still shows remaining Popup and Options presentation differences, and the latest owner result remains FAIL.""",
    """Subsequent paired computed evidence closes three bounded default-presentation nodes in automation:

- ordinary Head `816388cf5f019ebd44e758149f36d99fa2507193` verifies the default About sidebar, navigation, product, actions, notices and license layout;
- ordinary Head `d24da81362bb3f5c2382e156cb7bf39d54721231` verifies the default Popup shell, rows, typography, selected state, separators and Options action;
- ordinary Head `cb58afaf10714d1ea7219f8871f511b06375cac2` verifies the default clean-room icon boxes, trailing globes, wrench and active outline, with all six gates passing on the first run.

These slices correct direction and close demonstrated default-entry automation defects but do not justify increasing progress. Expanded Popup states, Options editors/dialogs, complete interactions and the latest owner FAIL remain open.""",
)

replace_once(
    status_path,
    """1. Extend paired evidence with computed layout and typography metrics for Original and Nex.
2. Align Options light-theme sidebar background, boundary, typography and vertical rhythm.
3. Re-run paired screenshots/DOM and the six permanent gates.
4. Align Popup icons, row geometry, selected state, divider and Options entry.
5. Audit remaining editor/dialog density and visible helper text against original evidence.
6. Expand paired evidence to the next original surface only after the current surface is aligned.
7. Validate Firefox first, Chromium second.
8. Do not request owner retest during this correction phase.""",
    """1. Expand paired evidence to the active Fixed and Switch Popup states.
2. Capture original result-selector, current-site action and temporary-rule surfaces.
3. Audit ownership-blocked and external-profile Popup states against original evidence.
4. Add paired Options profile-editor and dialog density evidence.
5. Remove any remaining unproven helper text or interaction-order differences.
6. Validate every bounded surface in Firefox first and Chromium second.
7. Keep the default-entry nodes stable while expanding coverage.
8. Do not request owner retest during this correction phase.""",
)

replace_once(
    status_path,
    """- `KG-ORIGINAL-UI-EVIDENCE-001` — paired original-facing UI capture: active.
- `KG-STARTUP-OWNERSHIP-001` — serialized startup/external ownership: `VERIFIED_AUTOMATION`.
- `KG-ICON-001` — complete Toolbar/Popup entry journey: `FAILED`.""",
    """- `KG-ORIGINAL-UI-EVIDENCE-001` — paired original-facing UI capture: active.
- `KG-OPTIONS-DEFAULT-LAYOUT-001` — default About presentation: `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-GEOMETRY-001` — default Popup geometry: `VERIFIED_AUTOMATION`.
- `KG-POPUP-DEFAULT-ICONS-001` — default Popup clean-room icons: `VERIFIED_AUTOMATION`.
- `KG-STARTUP-OWNERSHIP-001` — serialized startup/external ownership: `VERIFIED_AUTOMATION`.
- `KG-ICON-001` — complete Toolbar/Popup entry journey: `FAILED`.""",
)

icon_evidence = Path(icon_evidence_path).read_text()
marker = 'Ordinary Head `cb58afaf10714d1ea7219f8871f511b06375cac2` closes the default icon subset in automation.'
if marker not in icon_evidence:
    icon_evidence += """

## Final mixed-glyph result

Ordinary Head `cb58afaf10714d1ea7219f8871f511b06375cac2` closes the default icon subset in automation. All six permanent gates passed on the first run. Paired artifact `8844941625` (`sha256:af744d17438a7a5965796c7e04e14d1cf3bad05cd10da1e33ebd118b8f4fcbe2`) proves that the mixed clean-room glyph set preserves every previously verified icon box, row, label, divider and outline while retaining only the evidence-backed visual improvements.

Chromium explicitly waited for persisted System activation before external proxy installation, then completed the main journey and every Toolbar specialist step. Firefox and native Chromium Inspect also completed fully. This closes only the default Popup icon subset; expanded Popup states and owner acceptance remain open.
"""
Path(icon_evidence_path).write_text(icon_evidence)

subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', kg_path, status_path, icon_evidence_path],
    check=True,
)
