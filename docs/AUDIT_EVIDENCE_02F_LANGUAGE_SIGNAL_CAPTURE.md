# Audit Evidence 02F — Paired Language Signals

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records a read-only evidence enhancement. It is not a product correction, acceptance candidate or completion claim.

## Demonstrated ambiguity

The permanent paired Chromium run requests locale `zh-CN`. The official ZeroOmega v3.5.0 default Popup and Options screenshots nevertheless render English, while Nex renders Simplified Chinese. A screenshot alone could not determine whether this was:

- a real difference in extension UI-language selection;
- a distinction between page locale and Chromium extension UI locale;
- a difference in manifest default-locale behavior;
- or an artifact of the headless evidence environment.

Changing Nex language behavior without resolving that ambiguity would risk replacing a correct browser-localized implementation with an evidence-specific workaround.

## Language-signal evidence result

The normal-Head artifact for `a854f9c0f535fbafef40276a73326731a78fb35c` proves that both packages run under the same browser signals:

- requested capture locale: `zh-CN`;
- `navigator.language`: `zh-CN`;
- `navigator.languages`: `["zh-CN"]`;
- extension UI language: `zh-CN`;
- manifest `default_locale`: `en`.

Nex sets `document.documentElement.lang` to `zh-CN` and renders its replacement translation catalog. Official ZeroOmega v3.5.0 leaves the document language as `en` and renders English. The screenshot language difference is therefore real extension behavior, not a viewport, browser-version or requested-locale mismatch.

## Evidence enhancement

Each captured Original and Nex surface records:

- `navigator.language`;
- `navigator.languages`;
- `document.documentElement.lang`;
- `chrome.i18n.getUILanguage()` or the compatible browser API result;
- the extension manifest `default_locale`;
- the packaged `_locales` directory names.

These fields are added alongside the existing screenshot, rendered text, saved body DOM, normalized anchors, dimensions and hashes. The capture still runs in clean isolated browser profiles and records no user data.

Both evidence enhancements passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in atomic finalizers. Temporary patch scripts were removed in the same transactions.

## Required decision boundary

A fresh normal-Head paired artifact must establish which locale directories official v3.5.0 actually ships before changing Nex language selection. If the official package lacks a Simplified Chinese locale, the original-compatible default for `zh-CN` is English even though the browser UI language is Chinese. If an official Chinese locale exists but is not selected, the exact original selection rule must be reproduced instead of assuming `navigator.language`.

After language behavior is resolved, the next product slice can address remaining Popup and About styling differences with a stable text baseline.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
