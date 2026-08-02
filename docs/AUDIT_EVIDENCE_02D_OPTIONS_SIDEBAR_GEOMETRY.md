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

## Verification boundary

The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. Temporary patch scripts were removed in the same transaction.

The six permanent read-only gates must now run on a normal repository Head. The resulting paired Options artifact must be inspected before changing brand spelling, language, About legal/open-source copy or finer Popup styling.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
