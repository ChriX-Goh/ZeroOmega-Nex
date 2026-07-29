# Milestone 8 Status — Original-Compatible UI and Profile Workflow

**Branch:** `feat/m8-profile-workflow`  
**Pull request:** #11  
**PR state:** Draft  
**Active candidate:** none  
**Last candidate:** `M8-OWNER-QC-1` — `FAILED` on 2026-07-30  
**Completion percentage:** unknown pending full parity re-audit

## Status correction

Milestone 8 is not 100% complete and is not close enough to release for a meaningful percentage estimate.

The previous `98%` estimate and `DONE=124 / PARTIAL=2` summary measured an incomplete automated contract. Repository-owner trial demonstrated broad product mismatches that were absent from that contract.

The project has therefore returned from candidate QC to full Original ↔ Nex parity audit.

## Owner-QC findings that reopen the milestone

1. Browser toolbar icon and visible state do not match the original and do not respond correctly to active profile/runtime changes.
2. A real configuration exported by the original extension cannot yet be imported and used directly with equivalent behavior.
3. UI layout, information density, action hierarchy and interaction logic remain substantially different.
4. Nex adds many description/help boxes and auxiliary workflow that are not justified by the original product contract.
5. Additional mismatches are broad enough that they cannot be treated as a short final defect list.

## Current engineering evidence

The branch still contains substantial implemented foundations:

- typed ProfileSpec and workflow state;
- deterministic PAC compilation;
- Chromium and Firefox adapters;
- Fixed, Switch, PAC and Virtual editors;
- Popup, temporary rules, diagnostics, snapshots and rollback foundations;
- localization and automated browser checks;
- legacy backup decoding/export code;
- real HTTP/HTTPS proxy-authentication tests.

These foundations are implementation evidence, not proof of original-compatible delivery.

## Acceptance authority

The current owner-facing and engineering authority is:

- `docs/ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`

It defines:

- the original product graph;
- the current Nex graph;
- required mapping edges;
- evidence required for every delivery row;
- initial owner-reported defects;
- the delivery order;
- the final completion rule.

Existing documents remain supporting evidence but no existing `DONE` row is trusted as owner-complete without revalidation under that contract.

## Failed candidate record

`M8-OWNER-QC-1` remains historically fixed to:

- Head `46b10285b25ab0a0d7faae4d4822d5f4c3492a2a`;
- Artifact `8725915254`;
- product Head `23272bd9efc4abbcec5ca99c86d31a1353714e8b`.

Its status is `FAILED`; it must not be reissued or described as a current candidate.

## Immediate work order

### 0. Governance and candidate reset

- candidate marked failed;
- completion claims withdrawn;
- no new candidate generation.

### 1. Original product capture

Capture source and runtime evidence for:

- toolbar icon/badge/title states;
- Popup layout and workflows;
- Options navigation, pages, dialogs and Apply/Discard behavior;
- every profile lifecycle and type editor;
- condition editing and attached Rule Lists;
- backup schema, runtime fields, startup state and quick-switch state;
- visual density, terminology and localized surfaces.

### 2. Current Nex capture

Capture the same nodes independently, including every extra description box, dialog and auxiliary surface.

### 3. Original ↔ Nex mapping

For every node record:

- original evidence;
- Nex evidence;
- gap type;
- required correction;
- test evidence;
- real-data evidence;
- Chromium/Firefox evidence;
- owner result.

### 4. Fix complete user journeys

Priority:

1. startup and toolbar state;
2. direct import and use of real original backups;
3. Popup workflows;
4. Options information architecture and Apply/Discard;
5. complete profile editing journeys;
6. exports, restart, rollback, ownership and authentication;
7. visual and localization alignment.

## Candidate prohibition

No new candidate may be frozen until:

- the complete comparison graph is mapped;
- representative real original backups import and work directly;
- broad UI and workflow mismatches are resolved;
- extra UI is justified or removed;
- both browsers pass real user journeys;
- the repository owner explicitly accepts the exact build.

## Current next action

Build the detailed Original ↔ Nex comparison order, beginning with toolbar state and real-backup import, then use that order as the implementation backlog and final delivery checklist.