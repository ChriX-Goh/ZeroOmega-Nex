# Audit Evidence 02E — Options About Structure

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records one bounded correction of the default About page. It is not an acceptance candidate or completion claim.

## Original authority

The permanent paired evidence for ordinary Head `260b038a6b25a1410d79f19f3df614c590f8ab2a` saved both rendered DOM and normalized anchors:

- artifact: `original-nex-ui-evidence-260b038a6b25a1410d79f19f3df614c590f8ab2a`;
- artifact ID: `8832868132`;
- SHA-256: `0e4e80bc7518759ce3d6cfe81d71fae0633b863b732130292d60ee243fb5d85f`.

The captured official ZeroOmega v3.5.0 About DOM confirms:

- Report issues uses a comment glyph;
- Save error log uses a download glyph;
- Reset options uses an alert glyph;
- the network-service, privacy and help notices use information, privacy and question glyphs with warning, success and information colors;
- privacy links to `https://github.com/FelisCatus/SwitchyOmega/wiki/Privacy#english`;
- FAQ links to `https://github.com/FelisCatus/SwitchyOmega/wiki/FAQ`;
- author, free-software, GPL, ZeroOmega-project and other-open-source references are links rather than plain text;
- the fourth open-source credit line is part of the normal About page.

The official `omega-web/src/partials/about.jade` at tag `v3.5.0` independently confirms the same information hierarchy and glyph roles.

## Original-derived correction

The verified correction:

- adds deterministic SVG equivalents for the three About actions and three status notices;
- restores the original notice color semantics;
- restores the exact official privacy and FAQ targets;
- restores exact SwitchyOmega-author, ZeroOmega-contributor, free-software and GPL targets;
- restores the ZeroOmega project and other open-source-software targets;
- restores the missing fourth open-source credit line;
- preserves the current locale selection logic rather than forcing English based on a possibly different browser UI locale;
- preserves the real Nex manifest version and does not impersonate original version `3.5.0`.

The locale inventory explicitly classifies the restored original legal and attribution fragments. The UI compatibility guard now requires all six glyph roles, official link targets and the open-source credit to remain present.

## Verification boundary

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

The six permanent read-only gates must now run on a normal repository Head, and the paired screenshot/DOM artifact must be inspected before further changes to language, brand spelling or fine visual styling.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
