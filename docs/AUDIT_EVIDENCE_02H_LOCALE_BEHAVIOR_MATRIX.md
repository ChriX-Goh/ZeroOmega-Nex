# Audit Evidence 02H — Locale Behavior Matrix

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records one paired language investigation and its bounded original-facing correction. It is not an acceptance candidate or completion claim.

## Matrix authority

The permanent paired evidence artifact for ordinary Head `4d1e645e8ade5e78d1f8119b5b527b4cc530eda1` is:

- artifact: `original-nex-ui-evidence-4d1e645e8ade5e78d1f8119b5b527b4cc530eda1`;
- artifact ID: `8833387385`;
- SHA-256: `1953f6effa91218618b0a3167eafb470d68f8eb727e69d347e7a024e9ee62a78`.

It launches clean isolated Original and Nex profiles under:

- `en-US`;
- `zh-CN`;
- `zh-TW`.

For each implementation and locale it records default Popup and Options rendered text, normalized text lines, browser language signals, document language, extension UI language and manifest default locale.

## Matrix result

Official ZeroOmega v3.5.0 renders its default Popup and Options in English for all three tested browser and extension UI languages:

- `en-US` → English;
- `zh-CN` → English;
- `zh-TW` → English.

This remains true even though the official package contains `zh_CN` and `zh_TW` locale directories and both Chinese runs report the corresponding browser and extension UI language. The original default language behavior is therefore stable English, not automatic selection from `navigator.language`.

Before correction, Nex rendered:

- `en-US` → English;
- `zh-CN` → Simplified Chinese;
- `zh-TW` → Traditional Chinese.

That automatic language change was a visible replacement-product behavior and violated the original default entry contract.

The same matrix also proved these original-facing text and structure differences:

- original Popup built-ins are `[Direct]` and `[System Proxy]`;
- original Options sidebar brand is `Zero Omega`;
- original English navigation uses `Import/Export` and `Builtin`;
- original About has no added Omega emblem before the product text.

## Verified product correction

Production Popup and Options now default to English regardless of browser UI language, matching the observed original rule.

The existing `WXT_ICON_RENDERER_E2E=1` build marker preserves the full localization browser journeys without changing a permanent workflow file:

- Chromium Browser E2E explicitly renders Simplified Chinese;
- Firefox Browser E2E explicitly renders Traditional Chinese;
- CI, production builds, Milestone visual evidence and Original ↔ Nex paired evidence do not carry that marker and therefore exercise the real English default.

The correction also:

- renders Popup built-ins as `[Direct]` and `[System Proxy]`, with translated text inside the brackets only in explicit localization E2E builds;
- restores the sidebar brand spelling `Zero Omega`;
- restores English `Import/Export` and `Builtin` labels;
- removes the Nex-only Omega emblem from the About product block;
- retains all Simplified and Traditional Chinese catalogs and unit-level locale resolution coverage.

The UI compatibility guard requires the English production default, explicit E2E localization boundary, bracketed built-ins, original sidebar spelling and absence of the About emblem. The Chromium exact Direct selectors were synchronized with the bracketed localized label; Firefox uses contained text and remains compatible.

## Verification boundary

The correction passed architecture, parity, localization, type checking, 555 unit tests, 25 component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

The six permanent read-only gates must now run on a normal repository Head. The resulting paired matrix must show English Original and English Nex for `en-US`, `zh-CN` and `zh-TW`, while Browser E2E must still pass its Simplified and Traditional Chinese journeys.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
