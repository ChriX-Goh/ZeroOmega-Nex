import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


kg_path = 'docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md'
status_path = 'docs/MILESTONE_8_STATUS.md'

replace_once(
    kg_path,
    """### `OriginalNexUiEvidenceBoundary` — `KG-ORIGINAL-UI-EVIDENCE-001`

- permanent read-only paired UI workflow;
- downloads and verifies official v3.5.0;
- builds exact Nex Head;
- same browser version, locale, viewport and theme;
- paired default Popup and Options screenshots;
- rendered text, text-line differences, page dimensions and hashes;
- Nex-only screenshots cannot close parity.""",
    """### `OriginalNexUiEvidenceBoundary` — `KG-ORIGINAL-UI-EVIDENCE-001`

- permanent read-only paired UI workflow;
- downloads and verifies official v3.5.0;
- builds exact Nex Head;
- same browser version, requested locale, viewport and theme;
- paired default Popup and Options screenshots;
- rendered text, saved body DOM, normalized anchors, page dimensions and hashes;
- browser language signals, document language, extension UI language and packaged locale directories;
- clean `en-US` / `zh-CN` / `zh-TW` Original ↔ Nex default-text matrix;
- Nex-only screenshots cannot close parity.""",
)
replace_once(
    kg_path,
    """Status: `IMPLEMENTED`, pre-commit diagnostic `VERIFIED_AUTOMATION`; permanent exact-Head gates pending final normal commit.""",
    """Status: bounded correction slice `VERIFIED_AUTOMATION`; owner acceptance remains absent and the complete entry journey remains open.""",
)
replace_once(
    kg_path,
    """## 6. Order graph""",
    """## 5A. Subsequent entry and reliability convergence

### `KG-ENTRY-CONVERGENCE-002`

Status: `VERIFIED_AUTOMATION` for the bounded default-entry slice.

Evidence-backed corrections:

- production Popup and Options default to English under `en-US`, `zh-CN` and `zh-TW`, matching official v3.5.0;
- explicit Browser E2E builds retain Simplified Chinese on Chromium and Traditional Chinese on Firefox;
- Popup built-ins render as `[Direct]` and `[System Proxy]`;
- Options sidebar brand is the original `Zero Omega`, while the About product name remains `ZeroOmega`;
- English navigation restores `Import/Export` and `Builtin`;
- About restores the independently generated 32×32 blue Omega product icon;
- About action/status icons, official links, author/license attribution and open-source credit are present;
- default Popup and Options text now match the original matrix except the truthful Nex version and original hidden-modal text;
- known History, Draft, capability-research and Nex-brand leaks remain absent.

Remaining presentation gaps:

- Options sidebar background, boundary, typography and vertical rhythm;
- Popup profile icons, row height, selected-state accent and Options entry icon;
- complete editor/dialog density and interaction audit.

### `KG-STARTUP-OWNERSHIP-001`

Status: `VERIFIED_AUTOMATION` on ordinary Head `92feff8c28fd01740d58bfb144aa5361aa85180f`.

Root-cause chain:

`external Fixed accepted -> detached startup recovery races Popup commands -> delayed System write -> ownership candidate disappears`

Verified correction:

- complete proxy startup recovery runs inside the profile-workflow command queue;
- runtime messages wait for authentication, pending recovery, temporary-rule reconciliation, external-state preservation, snapshot restoration, conditional startup activation and Toolbar refresh;
- explicit restore dispositions prevent preserved external state from falling through to the default System route;
- a blocking unit test proves concurrent messages cannot cross the startup recovery barrier;
- Chromium main E2E passed on the first attempt and continued through every Toolbar specialist step;
- Firefox main E2E and all Toolbar specialist steps remained green.

This closes the demonstrated automation defect but does not alter owner acceptance or project progress.

## 6. Order graph""",
)
replace_once(
    kg_path,
    """- `KG-POPUP-STRUCTURE-001` — `FAILED`.
- `KG-OPTIONS-STRUCTURE-001` — `FAILED`.
- `KG-OPTIONS-ABOUT-001` — `PARTIAL`.
- `KG-UI-DENSITY-001` — `FAILED`.
- `KG-ENGINEERING-LEAK-001` — first known leaks removed; complete surface audit open.
- `KG-FIREFOX-ENTRY-001` — owner failed; automated corrected journey pending exact Head.
- `KG-CHROMIUM-ENTRY-001` — confirmation pending after Firefox.
- `KG-OWNER-ORDER1-001` — `FAILED`; no retest scheduled.""",
    """- `KG-POPUP-STRUCTURE-001` — `PARTIAL`; default text/order converged, visual geometry and icons remain open.
- `KG-OPTIONS-STRUCTURE-001` — `PARTIAL`; hierarchy/default landing converged, presentation remains open.
- `KG-OPTIONS-ABOUT-001` — `PARTIAL`; text, links and product icon converged, exact styling remains open.
- `KG-UI-DENSITY-001` — `FAILED`.
- `KG-ENGINEERING-LEAK-001` — first known leaks removed; complete surface audit open.
- `KG-FIREFOX-ENTRY-001` — corrected automated journey `VERIFIED_AUTOMATION`; latest owner result remains `FAIL`.
- `KG-CHROMIUM-ENTRY-001` — corrected journey and specialist confirmation `VERIFIED_AUTOMATION`.
- `KG-STARTUP-OWNERSHIP-001` — first-attempt dual-browser automation verified.
- `KG-OWNER-ORDER1-001` — `FAILED`; no retest scheduled.""",
)
replace_once(
    kg_path,
    """First correction removes those specific inventions but does not close the complete comparison.""",
    """Subsequent captures additionally prove:

- exact default text parity across `en-US`, `zh-CN` and `zh-TW`;
- original sidebar spelling `Zero Omega` and About product spelling `ZeroOmega`;
- bracketed built-ins and the official About information structure;
- the 32×32 blue Omega About product icon;
- remaining differences are predominantly presentation geometry, icons, typography and truthful version text.

The bounded entry correction and startup ownership repair are automated and exact-Head verified, but the complete comparison and owner acceptance remain open.""",
)
replace_once(
    kg_path,
    """- `KG-POPUP-STRUCTURE-001` — Popup original hierarchy/geometry: `FAILED`.
- `KG-OPTIONS-STRUCTURE-001` — Options original hierarchy/geometry: `FAILED`.
- `KG-UI-001` — layout/density/dialog/control hierarchy: `FAILED`.""",
    """- `KG-POPUP-STRUCTURE-001` — Popup hierarchy/text converged; geometry/icons: `PARTIAL`.
- `KG-OPTIONS-STRUCTURE-001` — Options hierarchy/default entry converged; presentation: `PARTIAL`.
- `KG-STARTUP-OWNERSHIP-001` — serialized startup/external ownership: `VERIFIED_AUTOMATION`.
- `KG-UI-001` — layout/density/dialog/control hierarchy: `FAILED`.""",
)
replace_once(
    kg_path,
    """normal exact Head
  -> six permanent gates
  -> inspect paired Original/Nex Popup and Options evidence
  -> remove remaining unproven Popup/result-selector/Options differences
  -> Firefox corrected entry E2E
  -> Chromium confirmation
  -> expand paired surface inventory""",
    """normal exact Head
  -> six permanent gates green on 92feff8c
  -> capture computed Original/Nex layout and typography metrics
  -> align Options sidebar background/boundary/type/vertical rhythm
  -> inspect paired screenshots and DOM again
  -> align Popup icons/rows/selected state/Options entry
  -> Firefox first
  -> Chromium confirmation
  -> expand paired surface inventory""",
)

replace_once(
    status_path,
    """- loads Original and Nex in the same Chromium version, locale, viewport and light theme;
- captures paired default Popup and Options screenshots;
- records rendered body text, text lines, page dimensions and hashes;
- reports text present only in Nex and text missing from Nex.""",
    """- loads Original and Nex in the same Chromium version, requested locale, viewport and light theme;
- captures paired default Popup and Options screenshots;
- records rendered text, saved body DOM, normalized anchors, dimensions and hashes;
- records browser/document/extension language signals and packaged locale directories;
- captures a clean `en-US` / `zh-CN` / `zh-TW` default-text matrix;
- reports text present only in Nex and text missing from Nex.""",
)
replace_once(
    status_path,
    """## First correction slice — implemented and internally verified""",
    """## Entry correction slices — verified automation, owner-unaccepted""",
)
replace_once(
    status_path,
    """- original-facing product name `ZeroOmega` rather than `ZeroOmega Nex` or `Zero Omega`;""",
    """- original product spelling by surface: sidebar `Zero Omega`, About/product name `ZeroOmega`, and no `Nex` branding;""",
)
replace_once(
    status_path,
    """All temporary migration, export and diagnostic workflows/scripts were removed after the verified correction was committed. Standard CI was restored. The permanent paired Original ↔ Nex workflow remains.

This slice corrects direction but does not justify increasing progress. Paired evidence still shows remaining Popup and Options differences.""",
    """All temporary migration, export and diagnostic workflows/scripts were removed after the verified correction was committed. Standard CI was restored. The permanent paired Original ↔ Nex workflow remains.

Subsequent exact evidence also verifies:

- production defaults to original English under `en-US`, `zh-CN` and `zh-TW`;
- explicit Chromium and Firefox E2E builds retain Simplified and Traditional Chinese coverage;
- Popup built-ins use `[Direct]` and `[System Proxy]`;
- About links, attributions, status/action icons and the 32×32 blue Omega product icon match the original information structure;
- default Popup/Options text is aligned except the truthful Nex version and original hidden-modal text;
- complete startup recovery is serialized ahead of runtime messages, preventing delayed System writes over external Fixed/PAC state.

Ordinary Head `92feff8c28fd01740d58bfb144aa5361aa85180f` passed all six permanent gates. Chromium main E2E passed on its first attempt and completed every Toolbar specialist step; Firefox and native Chromium Inspect also completed fully.

These slices correct direction and close demonstrated automation defects but do not justify increasing progress. Paired evidence still shows remaining Popup and Options presentation differences, and the latest owner result remains FAIL.""",
)
replace_once(
    status_path,
    """4. Firefox passes the original-derived entry journey;
5. Chromium confirms the same behavior after Firefox;
6. paired Original ↔ Nex evidence shows material convergence across the relevant surfaces;
7. no intermediate user retest is requested before those gates are met.""",
    """4. Firefox automation continues to pass the original-derived entry journey;
5. Chromium continues to confirm the same behavior after Firefox without reruns;
6. paired Original ↔ Nex evidence shows material visual convergence across the relevant surfaces;
7. no intermediate user retest is requested before those gates are met;
8. the owner explicitly accepts a later exact build.""",
)
replace_once(
    status_path,
    """1. Run the permanent gates on a normal non-automation Head.
2. Inspect the new paired Popup and Options evidence rather than Nex-only screenshots.
3. Remove the remaining extra Popup result-selector block where it lacks original provenance.
4. Align Popup labels, icons, row geometry, selected state, divider and Options entry.
5. Align Options sidebar width, grouping, labels, About content and profile editor density.
6. Expand paired evidence to the next original surface only after the current surface is structurally aligned.
7. Validate Firefox first, Chromium second.
8. Do not request owner retest during this correction phase.""",
    """1. Extend paired evidence with computed layout and typography metrics for Original and Nex.
2. Align Options light-theme sidebar background, boundary, typography and vertical rhythm.
3. Re-run paired screenshots/DOM and the six permanent gates.
4. Align Popup icons, row geometry, selected state, divider and Options entry.
5. Audit remaining editor/dialog density and visible helper text against original evidence.
6. Expand paired evidence to the next original surface only after the current surface is aligned.
7. Validate Firefox first, Chromium second.
8. Do not request owner retest during this correction phase.""",
)
replace_once(
    status_path,
    """- `KG-ORIGINAL-UI-EVIDENCE-001` — paired original-facing UI capture: active.
- `KG-ICON-001` — complete Toolbar/Popup entry journey: `FAILED`.""",
    """- `KG-ORIGINAL-UI-EVIDENCE-001` — paired original-facing UI capture: active.
- `KG-STARTUP-OWNERSHIP-001` — serialized startup/external ownership: `VERIFIED_AUTOMATION`.
- `KG-ICON-001` — complete Toolbar/Popup entry journey: `FAILED`.""",
)

subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', kg_path, status_path],
    check=True,
)
