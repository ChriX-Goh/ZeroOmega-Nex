# Audit Evidence 02J — About Product Icon and Production Visual Matrix

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records one evidence correction and one production visual-capture correction. It is not an acceptance candidate or completion claim.

## Corrected original evidence

The latest paired screenshot and saved official v3.5.0 About DOM prove that the original product block contains:

```html
<div class="media-left">
  <img src="img/icons/omega-action-32.png" class="media-object" />
</div>
```

The visible asset is a 32×32 blue Omega action icon before the `ZeroOmega` heading. A preceding interpretation based only on text extraction incorrectly treated the icon as absent and removed the Nex icon. That interpretation is retired.

Nex already packages its independently generated equivalent as `/icon/original-action-32.png`. The About product block now uses that existing 32×32 asset with empty alternative text, matching the original image semantics without copying the official package asset.

The UI compatibility guard now requires the packaged About product icon. It no longer requires the icon to be absent. `AUDIT_EVIDENCE_02H_LOCALE_BEHAVIOR_MATRIX.md` was corrected in the same atomic transaction.

## Production visual matrix correction

The permanent Milestone 8 visual workflow builds the ordinary production extension without the Browser E2E localization marker. After production language was restored to the original English default, the capture script still waited for rendered `zh-CN` or `zh-TW` locale markers and timed out before taking screenshots.

The visual matrix now distinguishes:

- requested browser locale: `zh-CN` or `zh-TW`;
- original-compatible rendered product locale: `en`;
- theme: light or dark.

It continues to capture six representative surfaces for every requested-locale/theme combination. Metadata records both requested and rendered locales. Browser E2E remains the separate authority for explicit Simplified and Traditional Chinese rendering.

## Verification boundary

The product, evidence script, documentation and permanent guard passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

The latest atomic commit `9bb51f496fbf25604d80746d5a80bef0163904a9` is Actions-generated. This ordinary documentation Head must therefore run all six permanent gates. Required results:

- the paired About screenshot contains the 32px blue Omega icon;
- the production locale matrix remains English for `en-US`, `zh-CN` and `zh-TW`;
- Milestone 8 Visual Evidence completes all 24 images instead of timing out;
- Chromium and Firefox Browser E2E retain explicit Chinese coverage;
- no merge, release or owner retest becomes authorized.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate exists.
