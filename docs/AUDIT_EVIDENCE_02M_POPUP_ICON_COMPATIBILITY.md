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

## Evidence boundary

The permanent paired workflow now records leading icons, built-in trailing icons, the Options icon and computed outline values. A fresh ordinary Head must verify shape placement and preserve all six permanent gates before the default Popup icon slice can be considered automated.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
