# Audit Evidence 02H — Locale Behavior Matrix

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records a read-only paired language investigation. It is not a product correction, acceptance candidate or completion claim.

## Established evidence

The existing paired artifact proves that under requested Chromium locale `zh-CN`:

- Original and Nex both report `navigator.language: zh-CN`;
- Original and Nex both report extension UI language `zh-CN`;
- both manifests declare default locale `en`;
- official ZeroOmega v3.5.0 packages `en`, `zh_CN` and `zh_TW` resources;
- Original still renders English and leaves the document language as `en`;
- Nex renders Simplified Chinese and sets the document language to `zh-CN`.

The difference is therefore not explained by missing official Chinese resources or by a browser-locale mismatch. Original has a different default language-selection rule.

## Matrix enhancement

The permanent paired evidence now launches clean isolated Original and Nex profiles under:

- `en-US`;
- `zh-CN`;
- `zh-TW`.

For each implementation and locale it records default Popup and Options:

- rendered text and normalized text lines;
- `navigator.language` and `navigator.languages`;
- document language;
- extension UI language;
- manifest default locale.

The primary screenshot/DOM evidence remains unchanged. The matrix adds no user data and does not modify product state.

The enhancement passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

## Decision boundary

A normal-Head artifact must determine whether official v3.5.0:

- always defaults to English across the tested locales;
- selects Traditional Chinese but not Simplified Chinese;
- or follows another stable mapping.

Only then may Nex default language selection change. The correction must reproduce the observed original rule rather than hard-code a result from a single screenshot.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
