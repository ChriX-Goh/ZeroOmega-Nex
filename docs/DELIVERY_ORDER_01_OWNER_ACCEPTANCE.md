# Delivery Order 01 — Owner Acceptance

## Purpose

This is the single repository-owner acceptance contract for Order 1. It covers installation, startup, Toolbar, per-tab state, ordinary recovery and visible Action behavior on one exact Chromium/Firefox build.

It is not a release candidate and does not close original-export migration, complete Popup/Options parity, every profile lifecycle or final visual alignment.

## Readiness state

- Engineering state: `VERIFIED_AUTOMATION`.
- Chromium ordinary-use suite: passed.
- Firefox ordinary-use suite: passed.
- Normal browser restart with one user-edited Fixed profile: passed on both browsers.
- Native Chromium Inspect: passed.
- Original v3.5.0 evidence registry through 01O: passed.
- Owner result: `NOT RUN`.
- `KG-ICON-001`: remains `FAILED` until explicit owner `PASS`.

The exact Head, workflow conclusions and downloadable `browser-builds` artifact are resolved from Draft PR #11 and its GitHub Checks. Moving identifiers are not copied into this stable contract.

## Automated evidence included in the exact build

### Chromium

The permanent Browser E2E workflow verifies:

1. full extension journey;
2. clean-install System state;
3. Direct, user-edited Fixed proxy and bypass Action state;
4. same-tab transitions and two-tab isolation;
5. normal browser close/relaunch with Applied ProfileSpec, active Fixed route, endpoint and Action restoration;
6. attached Rule List 01H;
7. represented Switch, nested Switch, Virtual, nested Virtual, PAC, temporary-rule and Virtual → Switch traces;
8. competing-extension takeover and recovery;
9. renderer failure, static fallback, retry and recovery;
10. native Inspect set, clear, base restoration and tab isolation.

### Firefox

The permanent Browser E2E workflow verifies:

1. full extension journey;
2. clean-install System state;
3. Direct, user-edited Fixed proxy and bypass Action state;
4. same-tab transitions and two-tab isolation;
5. normal browser close/relaunch with Applied ProfileSpec, active Fixed route, endpoint and Action restoration;
6. attached Rule List 01H;
7. represented Switch, nested Switch, Virtual, nested Virtual, PAC, temporary-rule and Virtual → Switch traces;
8. external-control state and recovery;
9. renderer failure, fallback, retry and recovery.

### Permanent supporting gates

The same exact Head must pass:

- CI;
- Browser E2E;
- Original Toolbar Evidence;
- Milestone 8 Visual Evidence;
- Parity Documentation.

## Owner acceptance package

Use only the `browser-builds` artifact from the exact PR Head whose five permanent gates are green. Do not use an older local build, a branch working tree or the failed `M8-OWNER-QC-1` package.

The package contains the staged Chromium and Firefox builds produced by frozen-lockfile CI. The artifact digest shown by GitHub Actions binds the downloaded archive to that exact workflow run.

## One-pass owner journey

Run this once on the browser you use most. Use the second browser only for a focused visual and startup comparison; cross-browser functional states are already automated.

1. Temporarily load the exact build into a clean browser profile.
2. Before opening Options, confirm the Toolbar starts in System state.
3. Click the Toolbar icon and confirm the expected Popup opens.
4. Switch to Direct and confirm title, Badge, Ω state and Popup binding agree.
5. Select or create one ordinary Fixed profile and confirm its proxy state.
6. Exercise one bypass URL and confirm the same tab changes to the Direct result while another tab remains unchanged.
7. Exercise one ordinary Switch matched/default path.
8. Exercise one immediate Virtual path.
9. Exercise one attached Rule List path.
10. Select one URL-backed PAC profile and inspect its static Toolbar state.
11. Add one temporary current-site rule, visit an unmatched site, then remove the rule.
12. Open an internal browser page and confirm default fallback.
13. Use Inspect once, clear it and confirm the original tab state returns.
14. Close the browser normally, reopen it and confirm the active profile and Toolbar state return.
15. Review visible Ω geometry, current/result colors, title lines, Badge text and Popup target.
16. Record one result: `PASS` or `FAIL` with the first blocking mismatch.

The owner journey is an ordinary-use review, not a laboratory replay of every evidence subcase.

## Acceptance criteria

Record `PASS` only when:

- installation and initial System state are understandable without opening Options first;
- Toolbar, Popup and per-tab state do not contradict one another;
- ordinary Direct, Fixed, bypass, Switch, Virtual, Rule List, PAC and temporary-rule states remain recognizable to an experienced ZeroOmega user;
- normal restart restores the expected active state;
- no Nex-internal Draft, compile, snapshot or graph terminology leaks into Toolbar output;
- no visible mismatch blocks normal daily use.

Record `FAIL` when the first ordinary-use blocker appears. The failure must identify the exact browser, visible state, expected original behavior and observed Nex behavior. Fix that blocker before expanding Order 1 scope.

## Outcome record

- Exact tested Head: pending owner run.
- Browser and version: pending owner run.
- Artifact digest: pending owner run.
- Result: `NOT RUN`.
- First blocking mismatch: none recorded.
- Owner notes: none recorded.

## After the result

A `PASS` changes `KG-ICON-001` and Order 1 to `OWNER_ACCEPTED`, then authorizes Order 2 real original-export migration work.

A `FAIL` keeps Order 1 open. Only the demonstrated blocker and directly dependent states may be changed before the next exact acceptance build.
