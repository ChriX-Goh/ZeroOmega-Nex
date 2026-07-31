# Milestone 8 — Session 8 checkpoint

## Project contract

ZeroOmega Nex remains a faithful bottom-layer rewrite of ZeroOmega v3.5.0. The original user-facing product contract is authoritative; this is not a modernization redesign. Original exports must import directly and become immediately usable, and visible behavior must remain original-backed or explicitly owner-approved.

## Governance state

- PR: `#11`, Draft.
- Active candidate: none.
- Previous candidate `M8-OWNER-QC-1`: failed.
- Provisional project progress: `47%` (`46.7%`, confidence `42%–50%`).
- Active Order 1 progress: `35%`.
- Merge, release and candidate generation remain prohibited.
- No toolbar matrix row, `KG-ICON-001`, Order 1 or project-completion claim is closed by this checkpoint.

## Session 8 engineering result

Product commit `a69cdb3f1e215ad0306afe4083b67066f2c68d18` establishes a durable original-facing toolbar Action baseline:

- browser-level Action title, Badge, Popup and icon fallback can be written without a `tabId`;
- Direct and System establish a global Action baseline before per-tab URL-derived states override it;
- the coordinator refreshes the global baseline and then all identified tabs through the same single writer;
- Inspect delegates global writes without applying per-tab overlays;
- profile-workflow commands are serialized so concurrent `get` requests cannot observe a partially persisted but not-yet-activated initial state;
- activation follow-up may be asynchronous and is awaited before the command response resolves;
- startup recovery reactivates the saved startup route when profile state exists but proxy runtime state is missing;
- Firefox focused toolbar acceptance is command-driven rather than dependent on unrelated rename, authentication or Popup UI steps.

The transaction passed:

- architecture, UI, parity, localization, lint, formatting and type checks;
- `517` unit tests;
- `25` component tests;
- Chromium and Firefox builds plus manifest/CSP inspection;
- one complete Firefox extension journey;
- ten consecutive focused Firefox Action journeys covering System, Direct and simultaneous Fixed proxy/bypass states on two real tabs.

Temporary applicators, diagnostics and the one-time workflow were removed atomically in clean tree commit `db8b351053b023fe2d79e02d8fa4f77921440e65`.

## Verification boundary

Authenticated clean checkpoint `d201d203cd0fd64a14342414935a48c3c295e60c` passed all four permanent gates: CI `30671118969`, Browser E2E `30671118975`, Parity Documentation `30671118993` and Milestone 8 Visual Evidence `30671118990`. Browser E2E passed Firefox, Chromium toolbar Action and native Chromium Inspect jobs. This remains slice-level engineering evidence only.

That earlier synchronization checkpoint is superseded by the transition/Inspect acceptance below. The progress model remains unchanged because automation does not replace owner acceptance.

## Firefox acceptance stabilization

Test commit `b23d0be3223a371891364564f7390fe138bc3d0c` removes two timing-only false failures without weakening product assertions:

- Options Apply now waits for the profile-workflow view to become clean and not busy, then verifies the exact persistent Traditional Chinese `.draft-status` text;
- PAC acceptance now waits until the persisted active snapshot exists, uses compiler version `raw-pac/1`, targets the applied PAC profile and contains `FindProxyForURL`;
- all temporary workflow and applicator files were removed in the same commit.

Before that commit, the exact modified tree passed CI `30667693473`, Browser E2E `30667693463`, Parity Documentation `30667693502` and Milestone 8 Visual Evidence `30667693470`. The dedicated transaction also passed full verification and three consecutive complete Firefox extension journeys.

## Toolbar transition and Inspect acceptance

Permanent test commit `adf53faa98825729d5a6c5782dd21c61864e3087` adds the missing source-certain browser assertions:

- Chromium verifies System behavior on a real `chrome://version/` tab, Fixed fallback to the localized default Action, and same-tab Fixed proxy → bypass → proxy transitions;
- Firefox verifies the equivalent contract on a real `about:blank` browser tab and same-tab proxy ↔ bypass transitions; the dedicated transaction passed three consecutive focused Firefox journeys;
- Firefox Action waits now accept a final sample that reaches the exact expected state at the timeout boundary instead of rethrowing a stale WebDriver timeout;
- native Chromium Inspect now waits for the target and isolation tabs to settle to the same System baseline, captures `#`/Inspect title on the target tab, clears the overlay by selecting the current page URL, restores the base Action and proves the isolation tab remains unchanged;
- permanent Browser E2E now runs the focused Firefox toolbar Action job and uploads its diagnostics separately.

The dedicated transaction `30670819111` passed full `pnpm verify`, Chromium toolbar acceptance, three Firefox toolbar transition iterations and native Inspect set/clear/isolation. Clean authenticated Head `d201d203cd0fd64a14342414935a48c3c295e60c` then passed CI `30671118969`, Browser E2E `30671118975`, Parity Documentation `30671118993` and Milestone 8 Visual Evidence `30671118990`.

## Remaining Order 1 work

- complete Switch/PAC default and matched-result traces;
- Virtual and attached Rule List traces;
- temporary-rule and external-control transitions through the single writer;
- forced dynamic-render failure/static-fallback evidence where feasible;
- headed toolbar pixels where browser-readable state is insufficient;
- focused repository-owner acceptance and explicit `PASS`.

## Next gate

1. Preserve and integrate the complete original `matchProfile.results` traces for Switch/PAC/Virtual/attached Rule List/temporary-rule/external-control states.
2. Force dynamic-render failure/static fallback where feasible and capture headed toolbar pixels only where Action API state is insufficient.
3. Run focused repository-owner acceptance for startup/System, Direct, user Fixed, two-tab isolation, Popup and Inspect.
4. Keep progress at 47% / 35% until the remaining real-browser and owner-acceptance gates close.
