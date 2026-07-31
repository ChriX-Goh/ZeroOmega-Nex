from pathlib import Path


CHECKPOINT = """Clean Head `e03e76e7edf310ddd6f947e77453febf0de07f58` passed all permanent gates after the knowledge-graph sync and temporary-file cleanup:

- CI `30657732067`;
- Browser E2E `30657732048`;
- Parity Documentation `30657732107`;
- Milestone 8 Visual Evidence `30657732880`.

The permanent Chromium browser job includes the separate real toolbar Action E2E. It reads per-tab title, Badge and Popup for two real web tabs and verifies System → Direct → Fixed proxy / Fixed bypass transitions. Firefox and native Chromium Inspect passed in the same Browser E2E run.
"""


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_between(text: str, start: str, end: str, replacement: str, label: str) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{label}: start marker missing")
    end_index = text.find(end, start_index + len(start))
    if end_index < 0:
        raise SystemExit(f"{label}: end marker missing")
    return text[:start_index] + replacement.rstrip() + "\n\n" + text[end_index:]


def replace_table_row(text: str, prefix: str, replacement: str, label: str) -> str:
    lines = text.splitlines()
    matches = [index for index, line in enumerate(lines) if line.startswith(prefix)]
    if len(matches) != 1:
        raise SystemExit(f"{label}: expected one row, found {len(matches)}")
    lines[matches[0]] = replacement
    return "\n".join(lines) + ("\n" if text.endswith("\n") else "")


active_path = Path("docs/ACTIVE_PARITY_AUDIT_INDEX.md")
active = active_path.read_text(encoding="utf-8")
active = replace_once(
    active,
    "- Current implementation includes exact original Ω geometry, color decisions, result Badge, pure per-tab presentation composition, an isolated Action adapter and an exact OffscreenCanvas renderer; none closes the toolbar journey until runtime integration and owner acceptance.",
    "- Current implementation registers one background owner for real browser Action writes and composes the repository resolver, per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Startup proactively initializes clean installations to the original System route and refreshes all tabs after activation or recovery.",
    "active implementation summary",
)
active = replace_once(
    active,
    "- Exact official Chromium and Firefox packages have now been executed for the basic reference states. Advanced states, Nex integration and owner acceptance remain open.",
    "- Exact official Chromium and Firefox packages cover the basic original reference states. Nex now has direct Chromium Action acceptance for System, Direct, Fixed proxy, Fixed bypass, two-tab isolation, localized title, four-code-unit Badge and per-tab Popup; advanced traces, direct Firefox Action API acceptance and owner acceptance remain open.",
    "active evidence summary",
)
active = replace_table_row(
    active,
    "|     1 | Installation / startup / toolbar",
    "|     1 | Installation / startup / toolbar                         | `DELIVERY_ORDER_01_TOOLBAR_STATE.md` | Original source/package/runtime evidence plus permanent Nex Chromium Action E2E | Background single-writer runtime, original System startup, Direct/System/Fixed resolver, Inspect overlay and real two-tab Chromium Action state are verified; Switch/PAC/Virtual/Rule List/temp/external traces, direct Firefox Action acceptance and owner PASS remain open | Complete the remaining original trace inputs, add direct Firefox Action acceptance, then run focused owner acceptance |",
    "active order row",
)
active = replace_between(
    active,
    "### Confirmed Nex gap",
    "### Source-certain implementation",
    """### Current Nex runtime and remaining gap

Confirmed real runtime:

- the background constructs the real Action/i18n/tabs/OffscreenCanvas boundary and registers one Action writer;
- the repository-backed resolver covers Direct, System, Fixed proxy and Fixed bypass results;
- the race-safe coordinator owns tab URL updates, activation, all-tab refresh, stale-result suppression and cache invalidation;
- clean installations proactively initialize to System without opening Popup or Options; existing state follows restore/recovery without duplicate activation;
- Inspect is an overlay input to the same executor rather than a competing title/Badge writer;
- permanent Chromium Action E2E reads two tab IDs through `chrome.action.getTitle`, `getBadgeText` and `getPopup` across System → Direct → Fixed transitions;
- cross-document revision archives are filtered by current `documentId` before current-document validation.

Remaining gap:

- Switch, PAC, Virtual, attached Rule List, temporary-rule and external-control states still lack the complete original result trace;
- direct equivalent Action API acceptance in Firefox remains open;
- explicit internal-page, same-tab URL-transition, Inspect set/clear Action capture and forced renderer-fallback evidence remain open;
- no toolbar row is owner-complete until focused repository-owner acceptance passes.
""",
    "active Nex runtime",
)
active = replace_between(
    active,
    "### Source-certain implementation",
    "### Last fully green engineering slice",
    """### Source-certain implementation

- exact Ω geometry, original static assets, one/two-color state and five-size OffscreenCanvas renderer;
- original title/detail localization, result-Badge preference and four-code-unit truncation;
- target-specific manifest Action contract and isolated browser Action adapter;
- pure state → localization → renderer → executor path;
- repository-backed Direct/System/Fixed resolver;
- race-safe per-tab coordinator and background runtime manager;
- single-writer Inspect overlay;
- proactive System initialization and ordered restore/recovery;
- permanent Chromium toolbar Action E2E in `scripts/e2e-chromium-toolbar.mjs`;
- regression coverage for cross-document revision history isolation.

These close implementation and automation slices only. They do not close `KG-ICON-001` or authorize a candidate.
""",
    "active source implementation",
)
active = replace_between(
    active,
    "### Last fully green engineering slice",
    "### Evidence correction and official packages",
    """### Last fully green engineering slice

""" + CHECKPOINT + "\nThe checkpoint remains slice-level evidence. Progress stays 47%, Order 1 stays 35%, and no candidate is authorized.",
    "active green slice",
)
active_path.write_text(active, encoding="utf-8")


status_path = Path("docs/MILESTONE_8_STATUS.md")
status = status_path.read_text(encoding="utf-8")
status = replace_between(
    status,
    "## Active Order 1 checkpoint",
    "## Runtime harness boundary",
    """## Active Order 1 checkpoint

Captured original authority remains the exact v3.5.0 source, official Chromium/Firefox packages and installed runtime evidence recorded in the Order 1 documents.

Current verified Nex runtime:

- one registered background owner performs all real Action writes;
- real `browser.action`, `browser.i18n`, `browser.tabs` and OffscreenCanvas boundaries are constructed in the background;
- the repository resolver covers Direct, System, Fixed proxy and Fixed bypass;
- the per-tab coordinator handles URL updates, activation, serialization, stale-result suppression, lifecycle invalidation, cache invalidation and all-tab refresh;
- clean installations proactively initialize to the original System route without opening UI; existing state follows restore/recovery without duplicate activation;
- Inspect feeds a single-writer overlay and no longer mutates title/Badge independently;
- permanent Chromium Action E2E directly verifies two tab IDs through `getTitle`, `getBadgeText` and `getPopup` across System → Direct → Fixed proxy / Fixed bypass;
- cross-document revision history is isolated by current `documentId` before validation.

### Exact verified checkpoint

""" + CHECKPOINT + """
Still open:

- complete Switch/PAC/Virtual/attached Rule List/temporary-rule/external-control result traces;
- direct equivalent Firefox Action API acceptance;
- explicit internal-page, same-tab URL-transition, Inspect set/clear and forced renderer-fallback Action evidence;
- headed toolbar pixels where browser-readable state is insufficient;
- repository-owner acceptance of the corrected Order 1 journey.

No `TB-*` row or `KG-ICON-001` is owner-complete.
""",
    "status Order 1",
)
status = replace_between(
    status,
    "## Runtime harness boundary",
    "## Non-invention rule",
    """## Runtime harness boundary

Permanent Nex Firefox E2E uses WebDriver BiDi for extension-page navigation and passes on Firefox 153.0. Historical original-package evidence remains fixed to Firefox 152.0.6; rerunning that separate original audit still requires the same BiDi migration or a pinned runtime.

The browser Action architecture now has one writer. Inspect, profile activation and startup recovery are integrated inputs. Temporary rules, inclusive-profile traces and external-control transitions remain explicit missing inputs rather than permission to add simplified invented wording.
""",
    "status harness",
)
status = replace_between(
    status,
    "## Immediate work order",
    "## Candidate prohibition",
    """## Immediate work order

### 1. Complete the remaining Order 1 trace contract

- capture and map Switch/PAC default and matched results;
- capture Virtual and attached Rule List results;
- connect temporary-rule and external-control transitions to the single writer;
- preserve the original multiline `matchProfile.results` wording and fail closed on unsupported trace shapes.

### 2. Expand direct real-browser Action acceptance

- add direct Firefox title/Badge/Popup acceptance;
- add explicit internal-page fallback and same-tab proxy↔bypass transition assertions;
- capture Inspect set/clear/isolation through the real Action API;
- force renderer failure and verify static fallback where feasible.

### 3. Run focused owner acceptance

- install the exact clean build;
- verify startup/System, Direct, user Fixed, two-tab isolation, Popup and Inspect;
- record repository-owner `PASS` or concrete defects;
- do not close `KG-ICON-001` from automation alone.

### 4. Continue the fixed delivery order

After Order 1 owner acceptance, proceed to real original export → direct import → immediate use. No UI redesign or unrelated feature expansion is authorized.
""",
    "status work order",
)
status = replace_once(
    status,
    "Complete the remaining original toolbar states, then implement the unified browser-action adapter and per-tab coordinator against the source plus Chromium/Firefox runtime evidence. No candidate is permitted.",
    "Complete the remaining original result traces and direct Firefox Action acceptance, then run focused Order 1 owner acceptance. No candidate is permitted.",
    "status next action",
)
status_path.write_text(status, encoding="utf-8")


verification_path = Path("docs/MILESTONE_8_VERIFICATION_HEAD.md")
verification = verification_path.read_text(encoding="utf-8")
verification = replace_between(
    verification,
    "## Current audit checkpoint",
    "## Confirmed integration boundary",
    """## Current audit checkpoint

- Provisional total progress: **47%**.
- Unrounded score: **46.7%**.
- Confidence band: **42%–50%**.
- Active journey: Order 1 — installation/startup/toolbar, **35%**.

""" + CHECKPOINT + """
This is an exact engineering and evidence checkpoint, not a release-completeness Head. It proves the mapped toolbar slice and permanent gates only.
""",
    "verification checkpoint",
)
verification = replace_between(
    verification,
    "## Confirmed integration boundary",
    "## Current boundary",
    """## Confirmed integration boundary

The background now registers one real browser Action writer composed from the repository resolver, per-tab coordinator, exact renderer, runtime localization and Inspect overlay. Clean installation initializes to System, existing state follows restore/recovery, and successful activation refreshes all tabs.

Permanent Chromium acceptance verifies System, Direct, Fixed proxy and Fixed bypass per-tab title/Badge/Popup state on two real tabs. Inspect no longer competes as a second title/Badge writer.

Still outside the verified slice are complete Switch/PAC/Virtual/Rule List/temporary-rule/external-control traces, direct Firefox Action API acceptance, explicit internal-page and same-tab transition assertions, forced renderer fallback and repository-owner PASS.
""",
    "verification integration",
)
verification_path.write_text(verification, encoding="utf-8")
