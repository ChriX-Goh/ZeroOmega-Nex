# Audit Evidence 02F — Paired Language Signals

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records a read-only evidence enhancement. It is not a product correction, acceptance candidate or completion claim.

## Demonstrated ambiguity

The permanent paired Chromium run requests locale `zh-CN`. The official ZeroOmega v3.5.0 default Popup and Options screenshots nevertheless render English, while Nex renders Simplified Chinese. A screenshot alone cannot determine whether this is:

- a real difference in extension UI-language selection;
- a distinction between page locale and Chromium extension UI locale;
- a difference in manifest default-locale behavior;
- or an artifact of the headless evidence environment.

Changing Nex language behavior without resolving that ambiguity would risk replacing a correct browser-localized implementation with an evidence-specific workaround.

## Evidence enhancement

Each captured Original and Nex surface now records:

- `navigator.language`;
- `navigator.languages`;
- `document.documentElement.lang`;
- `chrome.i18n.getUILanguage()` or the compatible browser API result;
- the extension manifest `default_locale`.

These fields are added alongside the existing screenshot, rendered text, saved body DOM, normalized anchors, dimensions and hashes. The capture still runs in clean isolated browser profiles and records no user data.

The enhancement passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

## Required decision boundary

A fresh normal-Head paired artifact must be inspected before changing Nex language selection or treating English-versus-Chinese screenshot text as a parity defect. After language behavior is resolved, the next product slice can address remaining Popup and About styling differences with a stable text baseline.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
