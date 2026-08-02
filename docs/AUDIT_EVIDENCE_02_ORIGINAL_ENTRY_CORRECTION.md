# Audit Evidence 02 — Original Entry Correction

## Authority

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md` and `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md`.

It records the first correction made after the 2026-08-02 Firefox owner `FAIL`. It is not an acceptance candidate or a completion claim.

## Demonstrated failure being corrected

The failed Firefox run showed that the extension icon changed while ordinary Popup and Options behavior still exposed a redesign: extra descriptions, engineering state, Nex branding, altered defaults and altered interaction hierarchy.

The required product direction is therefore:

- reproduce the original ZeroOmega v3.5.0 entry experience rather than inventing a successor UI;
- keep checkpoints, compilation state, revisions, snapshots, capability research and delivery status in code, tests and documentation only;
- validate browser-facing behavior in Firefox first and use Chromium as cross-browser confirmation;
- use paired official Original ↔ Nex evidence instead of Nex-only screenshots.

## Correction included

The first correction slice contains:

- official default `proxy` and `auto switch` profiles in original order;
- original default colors for `proxy`, `auto switch`, Direct and System;
- Options default navigation to About;
- removal of ordinary History navigation, persistent Draft/application status and the Fixed protocol-capability research table;
- removal of visible Popup Nex branding and remaining `ZeroOmega Nex` Options accessibility branding;
- Popup selection behavior decoupled from the keyboard Quick Switch preference;
- reset options routed through the background workflow boundary;
- Firefox navigation contract updated for the original-derived `options.html#/about` landing state;
- Chromium Popup assertions made exact so `Direct` cannot be confused with `auto switch [Direct]`;
- the UI validator changed from enforcing redesign-era About copy to preventing Nex branding, History, Draft status and capability research from re-entering ordinary UI.

## Follow-up guard correction

The first normal-Head run exposed redesign-era test assumptions rather than product regressions:

- the UI validator still required the removed `options.builtin.directHelp` explanatory copy;
- Chromium E2E still attempted to open the removed ordinary `配置历史` navigation item;
- several Firefox specialist scripts still rejected the original-derived `options.html#/about` landing URL;
- Popup accessibility and Options sidebar branding still contained `ZeroOmega Nex` or the incorrect `Zero Omega` spelling;
- a second Chromium Direct selector remained fuzzy and also matched `auto switch [Direct]`.

The corrected contracts now:

- require that the removed helper copy remains absent;
- assert that History is not exposed in ordinary Options while preserving background snapshot and rollback capability;
- accept `#/about` only for Options navigation in the Firefox main, restart, attached Rule List, profile-trace, external-control and renderer-fallback journeys;
- use the original `ZeroOmega` product spelling in visible and accessibility surfaces;
- use exact Direct selection where `auto switch [Direct]` is also present.

Firefox core entry E2E, Firefox Toolbar Action E2E and Firefox normal-restart E2E passed while these follow-up contracts were being isolated. The complete Firefox and Chromium jobs still require a fresh normal-Head run.

The final correction transaction passed architecture, parity, type checking, unit tests, component tests, lint and diff validation before it was committed. Its temporary patch scripts and writable workflow surface were removed before this checkpoint.

## Evidence boundary

The permanent gates must now run on a normal repository Head:

1. CI;
2. Browser E2E, with Firefox treated as the primary result;
3. Original Toolbar Evidence;
4. Original Nex UI Evidence;
5. Milestone 8 Visual Evidence;
6. Parity Documentation.

Green automation proves engineering health only. It does not close `KG-ICON-001`, `KG-UI-001`, `KG-EXTRA-001`, `KG-INVENTION-001` or `KG-FLOW-001`.

## Next bounded action

After the permanent gates complete, inspect the paired Popup and Options artifact. The next slice must remove the remaining Popup result-selector block where the original default Popup has no corresponding control, then align row geometry, icons, selected state, divider and Options entry. No owner retest is requested during this correction phase.

Project progress remains 48%; Order 1 remains 45%; no candidate, merge or release is authorized.
