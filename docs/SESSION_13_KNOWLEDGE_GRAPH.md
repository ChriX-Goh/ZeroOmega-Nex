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
- `ORIGINAL_KNOWLEDGE_GRAPH.md` and `UI_AUDIT_MATRIX.md` were updated together and formatted in the canonical synchronization commit.
- The bounded one-shot patch workflows deleted themselves in their own output commits; no maintenance workflow remains.
- The keyword-preservation workflow ran `validate-parity-docs` successfully before committing.
- Current state: `PENDING_EXACT_HEAD_VERIFICATION`.
- This documentation trigger does not change project or Order 1 progress.

## Current-site journey graph

```text
Order 1 entry experience
  └─ Popup
      ├─ default profile list                 verified by paired evidence
      ├─ closed current-site rows             verified by 02P
      ├─ temporary-rule dropdown              Session 13 active slice
      ├─ Add-condition dedicated form         Session 13 active slice
      ├─ temporary-rule runtime transaction   retained engineering evidence
      ├─ Add-condition runtime transaction    retained engineering evidence
      ├─ ownership-blocked/app state          active 02R slice
      ├─ external-profile state               active 02R slice
      └─ browser-owned/policy state           still open
```

## Evidence findings

Original source and runtime establish:

- the temporary-rule menu expands within the Popup list;
- the menu contains result profiles only;
- no temporary-rule manager row exists in that dropdown;
- Add condition changes to a dedicated form state;
- the profile menu and Options row disappear while the form is open;
- the form minimum width is 360 px;
- condition pattern is required.

The pre-Session-13 Nex implementation violated two visible structural contracts:

1. the Add-condition form appeared below the still-visible profile list and Options footer;
2. the temporary-rule dropdown added a Nex-only management row.

## Session 13 correction boundary

Allowed:

- Popup compatibility CSS;
- paired evidence capture for expanded states;
- documentation and assertions tied to original evidence.

Not allowed:

- profile engine redesign;
- temporary-rule storage redesign;
- new profile types;
- Options work;
- release packaging;
- owner retest.

## Acceptance for this slice

The slice is verified only when one exact Head proves:

- all six permanent workflows are green;
- paired expanded Popup evidence is green;
- no visible temporary manager row remains;
- Add-condition form replaces the menu;
- required-pattern validation remains intact;
- closed-state 02P evidence does not regress.

This slice does not increase the project percentage by itself. Progress changes only after the parent journey gate materially advances.

## Remaining Session 13 order

1. verify the expanded current-site evidence;
2. capture and align ownership-blocked state;
3. capture and align external-profile state;
4. capture and align browser-owned state;
5. reassess the complete Popup journey without scheduling owner retest.

## 02R execution boundary

- Real competing-extension takeover is the acceptance fixture for `reason=app`.
- A proxy value written through Nex while no represented route matches is the acceptance fixture for external profile.
- `reason=policy` / browser-owned remains OPEN; unit source mapping is not promoted to product evidence.
- Passing 02R will not increase project or Order 1 progress by itself.
