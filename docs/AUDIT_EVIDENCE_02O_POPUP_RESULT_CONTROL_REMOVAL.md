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

## Atomic verification

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation on Actions-generated commit `31c82c88a96f502b73e24ae5641d584b4364bcc4`. Temporary patch scripts were removed in the same transaction.

## Permanent verification

Chromium and Firefox E2E explicitly activate the default `auto switch`, require its exact one-line text and assert that both result selectors and labels remain absent. Schema-3 paired evidence requires zero result controls for Original and Nex and exact active-Switch text-line equality.

This ordinary evidence Head must pass all six permanent gates on its first run and produce an active-Switch paired capture whose text and height match Original. Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.

## First ordinary-Head result

Ordinary Head `43060a3b753dad758ae270625e7af46f70059775` proved the product correction in schema-3 paired evidence. Artifact `8845318793` (`sha256:2e0801eab0ab1d02244a050f2e660661359b5289637d6213a8fbae5969e6bc15`) shows active Fixed and active Switch text lines exactly match Original, both result-control metric arrays are empty, and the prior 29px height expansion is gone.

Firefox main E2E also passed the new active-Switch absence assertions. Chromium failed later because an older capability test still attempted to operate the removed Popup select. The corrected test now verifies the active imported Switch remains a single line with no result UI, then exercises `set-popup-profile-result` directly through the verified background command and retains the same atomic storage/snapshot assertions.

The typed-locale aggregate guard is also corrected to stop requiring the removed `popup.resultFor` surface. Its separate original-facing guard still requires the result selector and label to be absent while retaining the background mutation path.

This is a test-contract correction, not a product rollback. A fresh ordinary Head must pass without rerunning the failed Head.
