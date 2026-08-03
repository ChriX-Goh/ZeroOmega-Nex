# Audit Evidence 02M — Popup Icon Compatibility

## Scope

This checkpoint records one bounded clean-room Popup icon correction derived from the official v3.5.0 screenshot, DOM and computed metrics. It is not an acceptance candidate or completion claim.

## Original evidence

The official default Popup uses:

- transfer arrows before `[Direct]` and a gray globe after its label;
- a power glyph before `[System Proxy]` and a black globe after its label;
- a light-blue globe before `proxy`;
- a light-green retweet glyph before `auto switch`;
- a blue wrench before `Options`;
- 14px icon boxes at x `13`, aligned to y `17`, `50`, `86` and `119`.

These shapes and positions are visible in the official paired screenshot and DOM classes. No original font or binary icon asset is copied.

## Clean-room correction

A Popup-specific SVG component now supplies clean-room transfer, power, globe, retweet, wrench and fallback profile glyphs. It preserves route colors and the measured 14px box. Direct and System regain the trailing globe present in the original. The Nex-only current-profile check is removed.

The active action now uses the measured `outline: auto 1px` with `1px` offset rather than an invented inset shadow. Icon baseline moves up by 1px to the original y coordinates.

## Atomic verification

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation on Actions-generated commit `78061e22a6211d2049abd089df77c4081b30629b`. Temporary patch scripts were removed in the same transaction.

## Evidence boundary

The permanent paired workflow now records leading icons, built-in trailing icons, the Options icon and computed outline values. This ordinary evidence Head must verify shape placement and preserve all six permanent gates before the default Popup icon slice can be considered automated.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.

## First ordinary-Head result

Ordinary Head `dceea3f0d007ce15d37672358bb535384fcd6ca1` exposed three contract residuals. The paired artifact `8844320098` (`sha256:c5af26520c42fbb6626d6fd4a010591c669fa7f971606f70fa647f309d236e2e`) proved that leading icons and built-in trailing globes render at the intended vertical positions, and the active outline exactly matches Original. It also proved:

- the permanent metric still queried the retired `.profile-type-icon`, so leading icon metrics were empty;
- the generic `.settings-button span` compatibility rule overrode the component root, stretching the wrench across the row and moving `Options` to the next line;
- the trailing globe retained an unnecessary 6px margin because the clean-room bracket glyph widths differ from the original font rendering.

CI failed only because its static icon guard still required the retired `ProfileIcon` import. Chromium E2E failed only because its icon-count assertion still queried `[data-profile-kind]`. Firefox, native Chromium Inspect, paired evidence, Toolbar evidence, visual evidence and parity documentation passed.

The residual correction updates both permanent contracts to the Popup-specific icon data attributes, restores the wrench to a 14px inline box and removes the trailing margin so the globe x positions match Original. A fresh ordinary Head is required; no rerun of the failed Head counts as evidence.
