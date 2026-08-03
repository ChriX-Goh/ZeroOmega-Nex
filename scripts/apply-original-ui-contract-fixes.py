from pathlib import Path
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


capture_path = 'scripts/capture-original-nex-ui-evidence.mjs'
popup_app_path = 'apps/extension/src/entrypoints/popup/App.svelte'
popup_css_path = 'apps/extension/src/entrypoints/popup/original-compat.css'
options_evidence_path = 'docs/AUDIT_EVIDENCE_02K_COMPUTED_LAYOUT_METRICS.md'
popup_evidence_path = 'docs/AUDIT_EVIDENCE_02L_POPUP_COMPUTED_GEOMETRY.md'

replace_once(
    capture_path,
    """        profileRow: '.om-nav-item',
        profileAction: '.om-nav-item > a',
        profileIcon: '.om-nav-item > a > .glyphicon:first-child',
        profileName: '.om-profile-name',
        divider: '.om-divider',
        active: '.om-nav-item.om-active',""",
    """        profileRow: '#js-direct, #js-system, #js-profile-1, #js-profile-2',
        profileAction: '#js-direct, #js-system, #js-profile-1, #js-profile-2',
        profileIcon:
          '#js-direct > .glyphicon:first-child, #js-system > .glyphicon:first-child, #js-profile-1 > .glyphicon:first-child, #js-profile-2 > .glyphicon:first-child',
        profileName:
          '#js-direct > .om-profile-name, #js-system > .om-profile-name, #js-profile-1 > .om-profile-name, #js-profile-2 > .om-profile-name',
        divider: '.om-divider',
        active: '.om-nav-item.om-active > a',""",
)
replace_once(
    capture_path,
    """        profileRow: '.profile-row',""",
    """        profileRow: '.profile-row > button',""",
)
replace_once(
    capture_path,
    """            boxShadow: style.boxShadow,
            gap: style.gap,""",
    """            boxShadow: style.boxShadow,
            outline: style.outline,
            outlineOffset: style.outlineOffset,
            verticalAlign: style.verticalAlign,
            gap: style.gap,""",
)

popup_app = Path(popup_app_path).read_text()
count = popup_app.count('size={21}')
if count != 2:
    raise RuntimeError(f'{popup_app_path}: expected two 21px popup icons, found {count}')
Path(popup_app_path).write_text(popup_app.replace('size={21}', 'size={14}'))

popup_css = Path(popup_css_path).read_text()
marker = '/* Computed Original v3.5.0 default Popup list geometry. */'
if marker in popup_css:
    raise RuntimeError(f'{popup_css_path}: computed popup geometry already exists')
popup_css += """

/* Computed Original v3.5.0 default Popup list geometry. */
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) .popup-shell {
    width: 430px;
    min-width: 430px;
    margin: 10px 5px 5px;
    overflow: visible;
    background: transparent;
    color: #000;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 21px;
  }

  :root:not([data-theme='dark']) .profile-list {
    padding: 0;
  }

  :root:not([data-theme='dark']) .profile-row {
    margin: 0 0 2px;
    border-left: 0;
    background: transparent;
  }

  :root:not([data-theme='dark']) .profile-row:has(> button.active) {
    border-left: 0;
    background: transparent;
  }

  :root:not([data-theme='dark']) .profile-list .profile-row > button {
    display: block;
    width: 100%;
    height: 31px;
    min-height: 0;
    padding: 5px 25px 5px 8px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #337ab7;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 21px;
    text-align: left;
  }

  :root:not([data-theme='dark']) .profile-list .profile-row > button:hover:not(:disabled) {
    background: #f5f5f5;
  }

  :root:not([data-theme='dark']) .profile-list .profile-row > button.active {
    background: #337ab7;
    color: #000;
    box-shadow: inset 0 0 0 2px #111;
  }

  :root:not([data-theme='dark']) .profile-list .profile-type-icon {
    --profile-icon-size: 14px !important;
    display: inline-grid;
    margin-right: 8px;
    vertical-align: -2px;
  }

  :root:not([data-theme='dark']) .profile-name {
    display: inline;
    font-size: 14px;
    line-height: 21px;
  }

  :root:not([data-theme='dark']) .current-mark {
    display: none;
  }

  :root:not([data-theme='dark']) .profile-divider {
    height: 1px;
    margin: 0 0 2px;
    border: 0;
    background: #e5e5e5;
  }

  :root:not([data-theme='dark']) .popup-footer {
    display: block;
    min-height: 0;
    padding: 2px 0 0;
    border-top: 2px solid #e5e5e5;
    background: transparent;
  }

  :root:not([data-theme='dark']) .settings-button {
    display: block;
    width: 100%;
    height: 31px;
    min-height: 0;
    padding: 5px 25px 5px 8px;
    border: 0;
    border-radius: 4px;
    background: transparent;
    color: #337ab7;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 21px;
    text-align: left;
  }

  :root:not([data-theme='dark']) .settings-button svg {
    width: 14px;
    height: 14px;
    margin-right: 8px;
    vertical-align: -2px;
  }

  :root:not([data-theme='dark']) .settings-button span {
    display: inline;
  }
}
"""
Path(popup_css_path).write_text(popup_css)

options_evidence = Path(options_evidence_path).read_text()
options_marker = 'Ordinary Head `816388cf5f019ebd44e758149f36d99fa2507193` closes the final default Options geometry residual.'
if options_marker not in options_evidence:
    options_evidence += """

## Final default Options geometry result

Ordinary Head `816388cf5f019ebd44e758149f36d99fa2507193` closes the final default Options geometry residual. Its six permanent gates all passed. Paired artifact `8835728738` (`sha256:3e5916418c06b1112eccb7ffbbe56604b2d4b02142b169388022b03906ea05a8`) proves:

- all three notice rectangles match Original exactly;
- the license rectangle matches Original exactly at y `419.796875`, width `1145`, height `100`;
- product, product icon, action and navigation coordinates remain within `0.02px` of Original;
- the sidebar is white with no right border or shadow;
- visible brand text has the original family, size, weight, line height and blue color.

The default About layout can therefore leave structural correction and move to icon/detail review. This is automated paired evidence, not owner acceptance.
"""
Path(options_evidence_path).write_text(options_evidence)

Path(popup_evidence_path).write_text("""# Audit Evidence 02L — Popup Computed Geometry

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

The correction must pass the atomic repository validation and then a fresh normal-Head paired artifact. The artifact, not the CSS declaration, determines whether the measured geometry converged.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
""")

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        capture_path,
        popup_app_path,
        popup_css_path,
        options_evidence_path,
        popup_evidence_path,
    ],
    check=True,
)
