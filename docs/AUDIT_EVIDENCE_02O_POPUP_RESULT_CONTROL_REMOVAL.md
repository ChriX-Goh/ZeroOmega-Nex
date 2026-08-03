# Audit Evidence 02O — Popup Result Control Removal

## Scope

This checkpoint records one bounded original-facing correction identified by schema-3 paired evidence. It removes only the ordinary Popup result suffix and result-profile dropdown. It is not an acceptance candidate.

## Official behavior

With default `auto switch` active, official ZeroOmega v3.5.0 renders the same compact profile list as the default Popup. The active row text is exactly `auto switch`; there is no result suffix, label or select control.

## Nex defect

Nex rendered `auto switch [Direct]`, followed by a `Result` label and dropdown. This added an unproven editing workflow and increased Popup height by 29px.

## Bounded correction

The ordinary Popup now:

- renders every profile row as one line;
- keeps the active Switch label exactly `auto switch`;
- exposes no result label or result-profile select in inactive or active states;
- removes local result-editor state, handler and dead CSS.

The correction deliberately retains:

- `set-popup-profile-result` in the background command boundary;
- Switch/Virtual result mutation operations;
- Options editing capability;
- current-site condition result choices;
- temporary-rule result choices;
- Toolbar result projection.

## Permanent verification

Chromium and Firefox E2E explicitly activate the default `auto switch`, require its exact one-line text and assert that both result selectors and labels remain absent. Schema-3 paired evidence requires zero result controls for Original and Nex and exact active-Switch text-line equality.

The correction must pass the atomic repository validation and then a fresh ordinary Head with all six permanent gates. Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
