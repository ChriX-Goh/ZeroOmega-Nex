from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


order_path = Path("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md")
order = order_path.read_text(encoding="utf-8")
order = replace_once(
    order,
    "The current Nex branch has source-derived pure models for original Ω geometry, icon color decisions, result Badge behavior and per-tab presentation composition. It still lacks the browser Action adapter, per-tab coordinator and complete runtime convergence required by the original user-facing contract.",
    "The current Nex branch has source-derived pure models for original Ω geometry, icon color decisions, result Badge behavior and per-tab presentation composition. It now also has an isolated browser Action adapter and an exact original-compatible OffscreenCanvas renderer. These slices are tested but not connected to browser runtime state. The per-tab coordinator and complete runtime convergence remain absent.",
    "order summary",
)
order = replace_once(
    order,
    """  PURE[Pure original toolbar models] -. not connected .-> ACTION[Browser Action adapter]
  ACTION -. missing .-> COORD[Per-tab coordinator]""",
    """  PURE[Pure original toolbar models] --> RENDER[Exact OffscreenCanvas renderer]
  RENDER --> ACTION[Browser Action adapter]
  ACTION -. not connected .-> COORD[Per-tab coordinator]""",
    "order graph",
)
order = replace_once(
    order,
    """- manifest/static fallback still differs from the original contract;
- no complete Action adapter exists;
- no per-tab coordinator exists;""",
    """- manifest/static fallback still differs from the original contract;
- the Action adapter and renderer exist only as isolated tested boundaries and are not connected to `browser.action` runtime state;
- no per-tab coordinator exists;""",
    "order gaps",
)
order = replace_once(
    order,
    "Exact geometry and size contract are implemented as pure code. Browser Action ImageData generation, cache, fallback and target verification remain open.",
    "Exact geometry, the original single `300 × 300` OffscreenCanvas pipeline, five-size ImageData generation, color-pair caching, first-error reporting and anti-fingerprinting fallback signal are implemented and tested. Browser Action integration and target-visible icon verification remain open.",
    "TO-03",
)
order = replace_once(
    order,
    """Status: `NOT STARTED` under the corrected contract. This is the next implementation slice after remaining state inputs are bounded.

Required operations:

- `setIcon`;
- `setTitle`;
- `setBadgeText`;
- `setBadgeBackgroundColor`;
- clear/restore tab-specific state;
- target-specific Popup/default handling;
- static fallback.

No browser API mutation may occur inside the pure state model.""",
    """Status: `PARTIAL`.

Implemented and tested:

- one browser-API boundary for `setIcon`, `setTitle`, `setBadgeText`, `setBadgeBackgroundColor` and `setPopup`;
- every application rewrites all tab-visible fields to clear stale state;
- rejected dynamic ImageData falls back to the supplied original static icon paths.

Remaining:

- bind the adapter to the real target-specific `browser.action` API;
- supply exact target Popup/default constants and original static assets;
- connect derived tab state, localization and rendered ImageData through the coordinator.

No browser API mutation occurs inside the pure state model.""",
    "TO-04",
)
order = replace_once(
    order,
    """Last fully green pure-model Head `5b60bba3e1e66718a01171034582a606cf2334bb`:

- CI `30509677377`;
- Browser E2E `30509677387`;
- Parity Documentation `30509677380`;
- Milestone 8 Visual Evidence `30509677378`.

Current runtime/documentation changes require a new Exact-Head permanent-gate record after synchronization settles.""",
    """Exact engineering checkpoint Head `326c49ac30efc76d3884e63791dce3bbfb69722a` passed:

- CI `30598899116`;
- Browser E2E `30598899117`, including Firefox `153.0` through BiDi extension-page navigation;
- Parity Documentation `30598899120`;
- Milestone 8 Visual Evidence `30598899111`.

This validates the isolated Action adapter, exact Canvas renderer and Firefox 153 E2E harness correction. It does not close a `TB-*` row because no product runtime integration or owner acceptance exists yet.""",
    "order checkpoint",
)
order = replace_once(
    order,
    """1. Freeze the remaining original state inputs without inventing behavior.
2. Implement `TO-04` browser Action adapter.
3. Implement `TO-05` per-tab coordinator.
4. Convert Inspect direct writes into coordinator input.
5. Verify two-target, two-tab and state-transition behavior.
6. Deliver the exact build for repository-owner review.""",
    """1. Capture the exact original title/localization templates and target Popup/default constants; do not hard-code English.
2. Compose pure tab state → exact renderer → Action adapter in a runtime executor.
3. Implement `TO-05` per-tab coordinator.
4. Convert Inspect direct writes into coordinator input.
5. Verify two-target, two-tab and state-transition behavior.
6. Deliver the exact build for repository-owner review.""",
    "order next action",
)
order_path.write_text(order, encoding="utf-8")

index_path = Path("docs/ACTIVE_PARITY_AUDIT_INDEX.md")
index = index_path.read_text(encoding="utf-8")
index = replace_once(
    index,
    "- Current implementation includes exact original Ω geometry, color decisions, result Badge and pure per-tab presentation composition; none closes the toolbar journey.",
    "- Current implementation includes exact original Ω geometry, color decisions, result Badge, pure per-tab presentation composition, an isolated Action adapter and an exact OffscreenCanvas renderer; none closes the toolbar journey until runtime integration and owner acceptance.",
    "index summary",
)
index = replace_once(
    index,
    "Ω geometry, color, Badge and pure per-tab presentation models implemented; advanced states and unified browser-action coordination remain absent",
    "Ω geometry, color, Badge, pure per-tab presentation, isolated Action adapter and exact Canvas renderer implemented; advanced states and unified browser-action coordination remain absent",
    "index table state",
)
index = replace_once(
    index,
    "Capture remaining Fixed/Switch/PAC/Virtual/Rule List/temp/Inspect/external states, then implement one unified per-tab Action adapter/coordinator",
    "Capture remaining Fixed/Switch/PAC/Virtual/Rule List/temp/Inspect/external states, then compose the implemented renderer/Action adapter into one unified per-tab coordinator",
    "index next gate",
)
index = replace_once(
    index,
    """- current background has no complete toolbar state controller;
- no per-tab result coordinator or Action-state convergence exists;""",
    """- current background has no complete toolbar state controller;
- the tested Action adapter and Canvas renderer are not connected to runtime state;
- no per-tab result coordinator or Action-state convergence exists;""",
    "index gaps",
)
index = replace_once(
    index,
    """- Firefox runtime audit script: `scripts/audit-original-toolbar-firefox.mjs`;
- no manifest, toolbar permission, browser Action or tab-event product behavior has been changed yet;""",
    """- Firefox runtime audit script: `scripts/audit-original-toolbar-firefox.mjs`;
- `original-toolbar-action-adapter.ts` and its test centralize all per-tab Action writes and static fallback;
- `original-toolbar-icon-renderer.ts` and its test reproduce the original one-canvas, five-size, cached ImageData pipeline and privacy fallback signal;
- no manifest, toolbar permission, per-tab coordinator or tab-event product behavior has been changed yet;""",
    "index implementation",
)
index = replace_once(
    index,
    """### Last fully green pure-model slice

Head `5b60bba3e1e66718a01171034582a606cf2334bb` passed:

- CI `30509677377`;
- Browser E2E `30509677387`;
- Parity Documentation `30509677380`;
- Milestone 8 Visual Evidence `30509677378`.

The current evidence/documentation Head requires a new Exact-Head permanent-gate record after all synchronization commits settle.""",
    """### Last fully green engineering slice

Head `326c49ac30efc76d3884e63791dce3bbfb69722a` passed:

- CI `30598899116`;
- Browser E2E `30598899117`, including Firefox `153.0` through WebDriver BiDi navigation for all extension pages;
- Parity Documentation `30598899120`;
- Milestone 8 Visual Evidence `30598899111`.

The slice validates the isolated Action adapter, exact icon renderer and permanent Firefox 153 E2E harness. It does not close a toolbar row or authorize a candidate.""",
    "index checkpoint",
)
index = replace_once(
    index,
    "A later GitHub runner exposed Firefox `153.0`, whose Marionette navigation rejected direct `moz-extension://` navigation. This is a harness compatibility boundary after the successful Firefox `152.0.6` evidence run, not a product-parity result.",
    "A later GitHub runner exposed Firefox `153.0`, whose Marionette navigation rejected direct `moz-extension://` navigation. Permanent Nex E2E now navigates all extension pages through WebDriver BiDi and passes on Firefox `153.0`. The historical original-package evidence remains fixed to its successful Firefox `152.0.6` run; rerunning that separate audit still requires the same BiDi migration or a pinned runtime.",
    "index Firefox boundary",
)
index_path.write_text(index, encoding="utf-8")
