# Milestone 8 Candidate Gate

## Current state

**Active candidate:** none  
**Previous candidate:** `M8-OWNER-QC-1`  
**Previous candidate result:** `FAILED` on 2026-07-30

The failed candidate must not be installed, reissued, renamed, repackaged or treated as evidence that the project is close to release.

## Why the previous candidate failed

Repository-owner trial found project-wide original-compatibility failures:

- browser toolbar icon and visible state did not match the original;
- a real original exported configuration could not be imported and used directly;
- UI layout, information density, action hierarchy and interaction logic remained substantially different;
- many unnecessary descriptions, help boxes and additional workflows were present;
- multiple visible behaviors had been inferred or invented rather than strictly mapped from the original;
- further mismatches were too broad for focused candidate repair.

The exact failed identity remains historical evidence only:

- Candidate ID `M8-OWNER-QC-1`;
- Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`;
- Artifact `8725915254`;
- product Head `23272bd9efc4abbcec5ca99c86d31a1353714e8b`.

## Candidate authority

The candidate gate is subordinate to:

- `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`;
- `docs/MILESTONE_8_STATUS.md`.

The project is a complete bottom-layer rewrite with an original-compatible user contract. It is not a modernization redesign of the user experience.

## Candidate prohibition

No new installable candidate may be declared until all conditions below are satisfied.

### 1. Complete original capture

- Every original user-facing surface, control, dialog, action and state transition is captured.
- Toolbar icon, title, badge and profile/runtime states are captured.
- Popup dimensions, layout and complete workflows are captured.
- Options information architecture, wording, density and Apply/Discard behavior are captured.
- Every profile type, lifecycle operation, condition field and Rule List workflow is captured.
- Original export schemas, runtime/generated fields, startup state and Quick Switch state are captured.
- Unknown behavior is recorded as `UNKNOWN`, not filled by assumptions.

### 2. Independent Nex capture

- The current Nex product is captured without assuming equivalence.
- Every extra page, dialog, description, help box, warning, status taxonomy and workflow step is inventoried.
- Every visible Nex-only element has provenance.

### 3. Complete Original ↔ Nex mapping

Every required original node must have:

- original source and runtime evidence;
- original UI and data before/after;
- Nex source and runtime evidence;
- a mapping edge;
- missing, broken, extra or invented behavior;
- an exact correction target;
- automated acceptance;
- real original-export acceptance;
- Chromium and Firefox evidence;
- owner result.

Broad status rows such as “Popup done”, “Import done” or “Profile editor done” cannot satisfy this gate.

### 4. Direct migration acceptance

Representative sanitized files exported by the original extension must:

1. import directly into a clean Nex installation;
2. preserve meaningful supported configuration and relationships;
3. require no manual reconstruction;
4. become immediately usable;
5. produce equivalent browser behavior;
6. pass semantic export round trip.

The corpus must cover Fixed, Switch, PAC, Virtual, Rule Lists, colors, ordering, references, bypass, startup profile, active profile and Quick Switch state.

### 5. No-relearning acceptance

An experienced original user must be able to use Nex without material relearning.

The following must match the original unless a necessary divergence is evidenced and owner accepted:

- toolbar and Popup behavior;
- navigation and page boundaries;
- labels and terminology;
- controls and grouping;
- dialogs and validation timing;
- action hierarchy;
- information density;
- profile editing and state transitions.

### 6. No-invention acceptance

Every Nex-only user-visible item must be either:

- directly grounded in original source/runtime behavior; or
- a minimized, necessary divergence explicitly accepted by the owner.

Unnecessary descriptions, help boxes, compatibility summaries, extra dialogs and internal-architecture workflow must be removed.

### 7. Complete browser journeys

The exact build must pass complete real-data journeys in Chromium and Firefox:

- install and startup;
- toolbar and Popup state;
- original export import and immediate use;
- Options and Apply/Discard;
- all profile types and lifecycle operations;
- export;
- ownership and authentication;
- restart recovery;
- rollback;
- localization and visual review.

### 8. Owner-facing delivery order

Before a candidate ZIP exists, the owner must receive:

- Original/Nex side-by-side comparison report;
- complete mapped delivery checklist;
- real-export compatibility report;
- resolved and unresolved defect register;
- explicit necessary divergence list;
- removed Nex invention/extra list;
- Chromium and Firefox results.

## Candidate creation rule

Only after the repository owner accepts the mapped comparison state may one exact candidate be built and frozen.

A candidate identity must include:

- candidate ID;
- exact Head;
- product commit;
- workflow run IDs;
- artifact ID, expiry and hashes;
- exact package layout;
- browser versions;
- executable owner checklist.

A failed candidate cannot be silently replaced. Every replacement requires a new identity and complete evidence.

## Completion rule

PR #11 remains Draft and no release decision is permitted until one exact candidate passes:

- direct original-export migration;
- no-relearning UI/workflow acceptance;
- Chromium and Firefox complete journeys;
- restart, rollback, ownership and authentication;
- repository-owner `PASS`.
