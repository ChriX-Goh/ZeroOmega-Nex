# Audit Evidence 02L — Popup Computed Geometry

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry evidence.

It records one bounded default Popup presentation correction. It is not an acceptance candidate or completion claim.

## Metric authority

Ordinary Head `816388cf5f019ebd44e758149f36d99fa2507193` passed all six permanent gates. Its paired artifact is:

- artifact ID: `8835728738`;
- SHA-256: `3e5916418c06b1112eccb7ffbbe56604b2d4b02142b169388022b03906ea05a8`;
- schema: 2 plus computed outline data in the next capture.

The first Popup metrics contained hidden Original template rows and measured the active parent instead of the visible link. The evidence selector is corrected to compare the four visible default actions and the active action itself.

## Demonstrated default Popup differences

Before this correction, Nex used:

- a 440px shell beginning at x `0`, y `0`, versus Original's 430px content at x `5`, y `10`;
- inherited 9.75px action text versus Original 14px/21px;
- 36px rows versus Original 31px;
- 21px profile icons versus Original 14px;
- grid-stretched profile names versus Original inline labels;
- a green left marker and pale green parent background absent from Original;
- a 36px footer action at y `164`, versus Original 31px at y `149`;
- one spaced divider versus Original's measured separators and compact vertical rhythm.

## Bounded correction

The light-theme default list now restores:

- a 430px Popup content shell with 5px horizontal and 10px top offset inside the 440px viewport;
- Helvetica-family 14px/21px action typography;
- 31px actions with original 5px/8px padding and 4px radius;
- 14px profile icons with the original inline label rhythm;
- 2px row separation;
- the original blue active action with black content, without the Nex green parent marker;
- compact separators and an Options action at the original y position;
- removal of the Nex-only current-profile check mark from the default list.

This slice intentionally does not claim icon-shape parity. Direct/System/profile/switch/wrench glyph geometry remains the next Popup detail slice after computed positions are verified.

## Verification boundary

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation on Actions-generated commit `8d55a95c4c58e6ab608f0914e33df3b15bc453f6`. Temporary patch scripts were removed in the same transaction.

A fresh normal-Head paired artifact must now verify the computed positions, action styles and outline values. The artifact, not the CSS declaration, determines whether the measured geometry converged.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.

## Computed geometry result

Ordinary Head `d24da81362bb3f5c2382e156cb7bf39d54721231` proves the default Popup geometry correction converged. All six permanent gates passed. Artifact `8844187403` (`sha256:c8022698db95acb3e9fd4029d1a7b42a311e83f7cd40f19a456f85d671ec2bbc`) shows:

- shell rectangle exactly `x=5, y=10, width=430, height=170` for Original and Nex;
- all four action rectangles, typography, padding, radius, colors and backgrounds match exactly;
- all four name rectangles match within `0.02px` horizontally and exactly vertically;
- divider, Options action and overall vertical rhythm match exactly;
- profile icon rectangles match in size and x position but Nex icons are `1px` low;
- Original active styling uses `outline: auto 1px` with `1px` offset, while Nex used an inset shadow.

The geometry node can therefore move to verified automation. Remaining Popup default differences are icon paths, the missing built-in trailing globe and the active-outline implementation.
