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
- the first brand metric targeted the original `h1` container rather than its visible link; screenshot and DOM inspection prove the visible original brand remains link blue, so schema-v2 evidence now records both `brand` and `brandText`;
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
- restores the original brand weight and line height while retaining the visible original blue link color;
- reproduces the measured group geometry using the original 26px headings, 36px links, 2px row spacing and 1px dividers;
- restores exact 210px navigation item width and 240px heading span;
- restores the original Apply/Discard border, weight and color treatment;
- aligns the About title to a 30px/33px heading at y `20`;
- restores the measured product, notice and license spacing.

The correction is intentionally limited to desktop Options presentation. Popup styling, responsive layout, dark-theme palette and functional behavior are unchanged.

## Verification boundary

The first correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation on Actions-generated commit `af9293df8de7d7808156f41f504027df09d2b33e`. Temporary patch scripts were removed in the same transaction.

Ordinary Head `a08f3eabd05ded2385096bfa9dfb42e854f4e245` proved that navigation headings, links and action controls converged to within `0.02px` vertically and exact font/box metrics. It also proved these residuals:

- the light sidebar remained gray with its border and shadow because the first theme selector did not match the runtime `auto` theme state;
- the visible brand link was incorrectly changed to the parent container's gray color;
- the first notice remained `9.58px` too low;
- the license block retained five separate paragraph margins and measured `121.97px` instead of the original `100px`;
- About action buttons remained approximately `1.1px` too wide;
- the inner content width remained `5px` too wide.

The residual correction uses a light color-scheme selector that excludes explicit dark mode, restores the blue brand link, records a dedicated `brandText` metric, aligns notice and license line/paragraph geometry, reduces the action-icon gap by `1px`, and restores the original inner content width.

A subsequent normal-Head paired artifact must verify the actual residuals before Options is considered visually converged.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
