# Session 13 Knowledge Graph — Popup Current-Site Journey

## Authority

This graph extends `SESSION_12_KNOWLEDGE_GRAPH.md`. The authority order remains:

1. `PRODUCT_CONSTITUTION.md`;
2. `PROJECT_PROGRESS_MODEL.md`;
3. `MILESTONE_8_STATUS.md`;
4. exact PR #11 Head and GitHub Checks;
5. `SESSION_12_KNOWLEDGE_GRAPH.md`;
6. this graph;
7. bounded evidence documents.

## Frozen baseline

- Branch: `feat/m8-profile-workflow`.
- PR: #11, Draft.
- Session 13 start Head: `64bc13f059b9d51d83ff5fc9097442468f90bb68`.
- Latest owner result: Firefox `FAIL`, 2026-08-02.
- Active acceptance/release candidate: none.
- Project progress: 48%.
- Order 1 progress: 45%.
- Owner retest, merge, and release remain prohibited.

## Execution record

- Expanded-state implementation commit: `972f02f9ee491f3c83a027581bc570e70cd9cc25`.
- Canonical parity-document synchronization commit: `f50a608ec45104f481e47d423330e3ab04c6c31d`.
- Canonical validator keyword-preservation commit: `2df75294055d531b191c3774717280d8cf33c131`.
- 02R ownership/external-profile product commit: `2bf5d4f61396f0d72bf50760f247e6ad57e41871`.
- Permanent Chromium Popup external-profile gate commit: `762a1fa81c12741d61704f269442a2b58fdda919`.
- Loading-footer and blur-save correction commit: `a439245ac9472457e692898500e2362087e405df`.
- Browser-state readiness hardening commit: `6e43687aa300fe2a4653e1a6509361ba1f6e82a1`.
- 02R stable evidence Head: `49bad8aa7551e4bb6c5eabde2c8bdf375c2fea75`.
- Permanent Firefox policy-owned Popup gate commit: `38861967438435a60b2ddbfc43b868716725e295`.
- Complete current-site journey verified Head: `d63cd181ce68e5176c29a3fb8d8a3c59cc2018a2`.
- All six permanent workflows passed on the complete current-site journey Head; Browser E2E contained four successful isolated jobs.
- All bounded one-shot workflows and patch scripts were deleted; no maintenance machinery remains.
- Current state: `SESSION_13_CURRENT_SITE_JOURNEY_VERIFIED`.
- This slice does not change project or Order 1 progress.

## Current-site journey graph

```text
Order 1 entry experience
  └─ Popup
      ├─ default profile list                 verified by paired evidence
      ├─ closed current-site rows             verified by 02P
      ├─ temporary-rule dropdown              verified by 02Q
      ├─ Add-condition dedicated form         verified by 02Q
      ├─ temporary-rule runtime transaction   retained engineering evidence
      ├─ Add-condition runtime transaction    retained engineering evidence
      ├─ ownership-blocked/app state          verified by 02R
      ├─ external-profile state               verified by 02R
      └─ browser-owned/policy state           verified by 02S permanent gate
```

## Evidence findings

Original source and runtime establish:

- the temporary-rule menu expands within the Popup list;
- the menu contains result profiles only;
- no temporary-rule manager row exists in that dropdown;
- Add condition changes to a dedicated form state;
- the profile menu and Options row disappear while the form is open;
- the form minimum width is 360 px;
- condition pattern is required;
- loading retains the Options footer;
- ownership-blocked Popup hides profiles and Options;
- external-profile naming uses one inline input and submit/blur save behavior.

The pre-Session-13 Nex implementation violated visible structural contracts by keeping the profile list and Options visible beside Add condition, adding a temporary-rule management row, placing external profile after user profiles, and exposing separate Cancel/Save controls. These verified slices remove those redesign differences without changing the underlying profile engine.

## Session 13 correction boundary

Allowed:

- Popup compatibility CSS;
- paired evidence capture for Popup states;
- browser automation using reproducible ownership and external-profile fixtures;
- documentation and assertions tied to original evidence.

Not allowed:

- profile engine redesign;
- temporary-rule storage redesign;
- new profile types;
- Options work;
- release packaging;
- owner retest.

## Verified slice acceptance

Head `d63cd181ce68e5176c29a3fb8d8a3c59cc2018a2` proves:

- all six permanent workflows are green;
- paired expanded Popup evidence is green;
- no visible temporary manager row remains;
- Add-condition form replaces the menu;
- required-pattern validation remains intact;
- closed-state 02P evidence does not regress;
- loading retains Options;
- real competing-extension takeover renders the blocked Popup surface;
- external profile appears in original order and imports through blur-save;
- Chromium, Firefox and native Inspect browser jobs remain green;
- Chromium waits for workflow and ownership convergence before external-profile assertions;
- Firefox waits for the exact local current-site URL and completed tab state before Popup assertions.
- Firefox enterprise Locked Proxy returns native `not_controllable`, maps to `reason=policy`, and renders the blocked Popup in an isolated permanent Browser E2E job.
- all experimental policy workflows and the unsuccessful Chromium probe were removed before exact-Head acceptance.

This acceptance closes the Session 13 current-site Popup journey: 02Q expanded actions, 02R app/external-profile, and 02S policy/browser-owned. It does not close the wider Popup/Options journey and does not increase project progress by itself.

## 02R execution boundary

- Real competing-extension takeover is the acceptance fixture for `reason=app`.
- A proxy value written through Nex while no represented route matches is the acceptance fixture for external profile.
- `reason=policy` / browser-owned is verified separately by 02S using a real Firefox enterprise Locked Proxy policy; the proof is browser-native, not a mocked adapter.
- Passing 02R does not increase project or Order 1 progress by itself.

## Verification correction

Head `8c9c75d` exposed two stale contracts rather than a new product redesign: the loading shell incorrectly hid Options, and the older Chromium journey still clicked removed Cancel/Save controls. The corrected contract keeps Options during loading, hides it only when proxy ownership is blocked, and validates external-profile names through submit/blur behavior.

## 02R E2E readiness hardening

Documentation-only Head `eb6fe48` exposed nondeterministic readiness in two browser gates despite identical product code passing on `dfdd10d`:

- Chromium could open Popup before the profile workflow and ownership runtime converged on the external fixed proxy.
- Firefox could open Popup before its synthetic current-site tab reached the requested URL.

The permanent gates now wait on runtime state rather than elapsed time. The targeted Chromium and full Firefox journeys passed before commit, and all six permanent workflows subsequently passed on clean Head `49bad8aa7551e4bb6c5eabde2c8bdf375c2fea75`.

## Remaining Session 13 order

1. treat the current-site Popup journey as a verified bounded slice;
2. reassess the wider Popup journey and select the next original-facing surface from the project outline;
3. keep owner retest, merge and release prohibited until the parent Order 1 gate materially advances.

## 02S policy-owned runtime evidence

- Firefox `152.0.6` was launched with an enterprise `Proxy` policy using `Locked: true`.
- Native `browser.proxy.settings.get({})` returned `levelOfControl=not_controllable`.
- The ownership runtime returned `blocked=true`, `reason=policy`, `controlLevel=not-controllable`.
- The actual Popup rendered `data-reason=policy`, zero profile rows, zero Options footers, two control actions and one Manage entry.
- Probe run: `31013840605`; job: `92332623777`.
- Permanent Browser E2E run `31015030843`, isolated job `92336754415`, passed on exact Head `d63cd181ce68e5176c29a3fb8d8a3c59cc2018a2`; all six permanent workflows were green on the same Head.
