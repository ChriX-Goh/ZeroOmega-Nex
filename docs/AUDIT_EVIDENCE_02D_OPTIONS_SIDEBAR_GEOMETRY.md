# Audit Evidence 02D — Options Sidebar Geometry

## Scope

This checkpoint is subordinate to `PRODUCT_CONSTITUTION.md`, `DELIVERY_PLAN.md`, `MILESTONE_8_STATUS.md`, `ORIGINAL_NEX_DELIVERY_KNOWLEDGE_GRAPH.md` and the preceding Original Entry correction evidence.

It records one bounded Original ↔ Nex Options-shell correction. It is not an acceptance candidate or completion claim.

## Paired evidence authority

The correction is derived from the permanent `Original Nex UI Evidence` artifact for ordinary Head `effa703f083cb9f196cada55185a59385c637567`:

- artifact: `original-nex-ui-evidence-effa703f083cb9f196cada55185a59385c637567`;
- artifact ID: `8832427051`;
- SHA-256: `2e77a8ea98785d7a2337ba1d4a1ffc819c40d539bcd9b9054031dd130f025296`.

The paired Options screenshots showed that Nex still differed materially from official ZeroOmega v3.5.0:

- several navigation labels wrapped one character per line because text occupied the icon grid column;
- the sidebar used the wrong desktop geometry and horizontal padding;
- the Profiles group consumed remaining height and pushed Actions to the bottom of the viewport;
- a separate About navigation row appeared at the bottom although the original default About page had no such row;
- the main content offset, heading divider and About content width did not follow the original shell;
- settings and action rows lacked the familiar navigation glyphs.

## Original-derived correction

The verified correction:

- adds deterministic inline SVG navigation icons for Interface, General, Import/Export, Theme, Built-in Profiles, New Profile, Apply and Discard;
- keeps profile-specific icons but reduces them to the original sidebar scale;
- sets the desktop sidebar track to 240 pixels;
- aligns sidebar left padding and right-edge dividers with the paired original evidence;
- constrains navigation labels to one line with ellipsis instead of character-by-character wrapping;
- removes the flex expansion that pushed Actions to the viewport bottom;
- places Actions directly after Profiles;
- hides the duplicate bottom About navigation row;
- aligns the editor offset, heading divider, About content width and vertical rhythm with the original desktop shell.

No workflow, profile, Apply, import, proxy or browser-runtime behavior was changed.

## Normal-Head evidence result

The six permanent read-only gates passed on ordinary Head `720838313cd4c44d20decffd182501820628115e`.

Its paired artifact:

- artifact: `original-nex-ui-evidence-720838313cd4c44d20decffd182501820628115e`;
- artifact ID: `8832728333`;
- SHA-256: `bae2aaf03b3bb577bee3277d16d338235d5fc387c22557c7c9dad0c81c775698`.

The new screenshot confirms that character-by-character wrapping is gone, Actions follows Profiles, the duplicate About row is gone, and the sidebar/content geometry now follows the original desktop shell. Remaining About differences are fixed copy, button/status glyphs, links, one missing open-source credit line and finer styling rather than the previous structural failure.

## Paired DOM and link evidence

The permanent read-only comparison script now also saves the body DOM for each captured surface and records every anchor's text, absolute href, target and rel attributes in the manifest. This was added because screenshots prove link presence but cannot establish exact original targets. The enhancement passed the atomic full-repository verification and does not change product behavior or capture user data; it operates only on clean default Original and Nex pages.

A fresh normal-Head artifact must supply the exact official privacy, FAQ, license, project and open-source targets before the next About correction is committed.

## Verification boundary

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
