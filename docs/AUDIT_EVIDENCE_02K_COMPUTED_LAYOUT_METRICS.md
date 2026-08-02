# Audit Evidence 02K — Computed Layout Metrics

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records the first computed-style comparison and one bounded Options presentation correction. It is not an acceptance candidate or completion claim.

## Metric authority

The permanent paired artifact for ordinary Head `050ddadc78724c7e82ec140a6ad8d2bf280d8fb3` is:

- artifact: `original-nex-ui-evidence-050ddadc78724c7e82ec140a6ad8d2bf280d8fb3`;
- artifact ID: `8835315173`;
- SHA-256: `5ce247487f338be9932626142bcdc40d00e17f8fb71b9661426beb9b1e025870`;
- manifest schema: 2.

Each default Original and Nex Popup/Options capture records semantic element rectangles and computed layout/style properties in addition to screenshots, text, DOM, links and language evidence.

## Demonstrated Options differences

The exact light-theme metrics prove:

- Original base/navigation text: `14px / 20px`, Helvetica-family; Nex: `10.5px / 14.7px`, DejaVu/Arial-family;
- Original sidebar: transparent white page, no right border, no shadow; Nex: `#f5f5f5`, `1px` right border and `1px 0 3px` shadow;
- Original brand: `23.8px / 26.18px`, weight `700`, color `#5c6166`; Nex: `24px / 33.6px`, weight `600`, link blue;
- Original navigation headings: `11px / 20px`, weight `700`; Nex: `12px / 16.8px`, weight `600`;
- Original Settings items begin at y `109.86`, Profiles at `299.86`, Actions at `489.86` for Apply;
- Nex equivalents begin at y `115.39`, `321.19` and `526.98`;
- the Nex Actions heading is `28.33px` too low and Apply is `37.12px` too low;
- Original notice text uses `14px / 20px` with `10px` paragraph spacing; Nex uses `10.5px / 14.7px` with `6px` spacing;
- Original license block starts after `98px`; Nex uses `118px`.

These are computed browser values, not screenshot estimates.

## Bounded Options correction

The desktop compatibility layer now:

- restores the original Helvetica-family 14px Options baseline;
- removes the light-theme sidebar gray fill, right border and shadow;
- restores the original brand color, weight and line height;
- reproduces the measured group geometry using the original 26px headings, 36px links, 2px row spacing and 1px dividers;
- restores exact 210px navigation item width and 240px heading span;
- restores the original Apply/Discard border, weight and color treatment;
- aligns the About title to a 30px/33px heading at y `20`;
- restores the measured product, notice and license spacing.

The correction is intentionally limited to desktop Options presentation. Popup styling, responsive layout, dark-theme palette and functional behavior are unchanged.

## Verification boundary

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation on Actions-generated commit `af9293df8de7d7808156f41f504027df09d2b33e`. Temporary patch scripts were removed in the same transaction.

This ordinary evidence Head must now regenerate the paired screenshots and schema-v2 metrics. Actual computed positions and styles, not the intended CSS values, determine whether a second adjustment is required.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
