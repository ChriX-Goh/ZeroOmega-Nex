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

The initial component correction passed full atomic validation on Actions-generated commit `78061e22a6211d2049abd089df77c4081b30629b`. Its first ordinary Head exposed stale validator/E2E selectors and a wrench display override rather than a functional runtime defect.

The residual correction passed full atomic validation on Actions-generated commit `182776d7192e7baeefd6a9d4351293b62914cdf9`. It updates the static icon contract, Chromium icon locator, leading-icon evidence selector, inline wrench box and trailing-globe offset. Temporary patch scripts were removed in the same transaction.

## First ordinary-Head result

Ordinary Head `dceea3f0d007ce15d37672358bb535384fcd6ca1` exposed three contract residuals. The paired artifact `8844320098` (`sha256:c5af26520c42fbb6626d6fd4a010591c669fa7f971606f70fa647f309d236e2e`) proved that leading icons and built-in trailing globes render at the intended vertical positions, and the active outline exactly matches Original. It also proved:

- the permanent metric still queried the retired `.profile-type-icon`, so leading icon metrics were empty;
- the generic `.settings-button span` compatibility rule overrode the component root, stretching the wrench across the row and moving `Options` to the next line;
- the trailing globe retained an unnecessary 6px margin because the clean-room bracket glyph widths differ from the original font rendering.

CI failed only because its static icon guard still required the retired `ProfileIcon` import. Chromium E2E failed only because its icon-count assertion still queried `[data-profile-kind]`. Firefox, native Chromium Inspect, paired evidence, Toolbar evidence, visual evidence and parity documentation passed.

## Evidence boundary

This ordinary evidence Head must verify that CI and Chromium now pass without reruns, the Options wrench remains on the same line, all leading/trailing icon rectangles are recorded, and the four action rectangles remain unchanged. Only then can the default Popup icon slice be considered verified automation.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.

## Solid glyph detail slice

Ordinary Head `49201d946f30d0f4f22c5ad2110f57cbfe7fa7f3` passed all six permanent gates. Artifact `8844485148` (`sha256:9541671988c4825891c82c6005f2674f3b026d5a926a15e4a3a4fa94edd44529`) proves:

- all four leading icon boxes match Original at x `13`, y `17/50/86/119`, 14px square;
- both trailing globe boxes match Original within `0.02px` horizontally and exactly vertically;
- the Options wrench box matches Original at x `13`, y `156`, 14px square;
- action rectangles, text baselines, divider, active outline and Options row remain exact;
- CI, Firefox, Chromium, native Inspect and every Toolbar specialist step pass without reruns.

The final default-glyph detail slice replaces the remaining line-frame approximation with clean-room solid transfer, retweet and wrench paths, a heavier power symbol, and a solid globe with transparent land cutouts. It does not change boxes, colors, labels or interaction behavior. A subsequent ordinary artifact remains required before this visual detail is closed.
