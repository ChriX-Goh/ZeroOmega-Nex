# Audit Evidence 02K — Computed Layout Metrics

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records a read-only paired evidence enhancement. It is not a product correction, acceptance candidate or completion claim.

## Evidence gap

Paired screenshots and saved DOM established the remaining Options and Popup presentation differences, but screenshots alone do not reliably distinguish:

- geometry from typography;
- inherited font metrics from explicit CSS;
- background color from shadow or border;
- padding from margins and grid offsets;
- row height from line height;
- layout structure from browser rendering variance.

Changing CSS from visual estimation would risk another redesign-by-assumption.

## Computed evidence enhancement

Each default Original and Nex Popup/Options capture now records semantic layout metrics for corresponding elements.

Recorded properties include:

- bounding rectangle and element identity;
- display, position and box sizing;
- font family, size, weight, line height and letter spacing;
- foreground and background colors;
- padding and margins;
- every border edge and radius;
- box shadow and opacity;
- flex/grid alignment, gaps and column definitions;
- overflow behavior.

Options mappings cover the shell, sidebar, brand, navigation headings/items/dividers, content, page title, product block/icon, actions, notices and license block.

Popup mappings cover the shell, profile rows/actions/icons/names, dividers, active state and Options entry.

The manifest schema is now version 2. Existing screenshots, text, DOM, links, language signals, locale directories and three-locale matrix remain unchanged.

## Verification boundary

The enhancement passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

The atomic commit `3b01fc823d70c806e37b454d35bffc6811ad7126` is Actions-generated. This ordinary documentation Head must generate a fresh paired artifact. Its computed metrics become the sole authority for the next Options light-theme sidebar, typography and vertical-rhythm correction.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
