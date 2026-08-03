from pathlib import Path
import re
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


app_path = 'apps/extension/src/entrypoints/popup/App.svelte'
icon_path = 'apps/extension/src/entrypoints/popup/OriginalPopupIcon.svelte'
css_path = 'apps/extension/src/entrypoints/popup/original-compat.css'
capture_path = 'scripts/capture-original-nex-ui-evidence.mjs'
evidence_path = 'docs/AUDIT_EVIDENCE_02L_POPUP_COMPUTED_GEOMETRY.md'
icon_evidence_path = 'docs/AUDIT_EVIDENCE_02M_POPUP_ICON_COMPATIBILITY.md'

Path(icon_path).write_text("""<script lang="ts">
  export type OriginalPopupIconKind =
    | 'direct'
    | 'system'
    | 'fixed'
    | 'switch'
    | 'rule-list'
    | 'pac'
    | 'virtual'
    | 'auto-detect'
    | 'external'
    | 'globe'
    | 'wrench';

  export let kind: OriginalPopupIconKind;
  export let color = '#337ab7';
  export let size = 14;
  export let position: 'leading' | 'trailing' | 'options' = 'leading';
</script>

<span
  class:trailing={position === 'trailing'}
  class:options={position === 'options'}
  class="original-popup-icon"
  data-original-popup-icon={kind}
  data-original-popup-icon-position={position}
  style={`--original-popup-icon-color: ${color}; --original-popup-icon-size: ${size}px`}
  aria-hidden="true"
>
  <svg viewBox="0 0 14 14" focusable="false">
    {#if kind === 'direct'}
      <path d="M1.2 4.2h8.1M7.1 1.9l2.4 2.3-2.4 2.3M12.8 9.8H4.7M6.9 7.5 4.5 9.8l2.4 2.3" />
    {:else if kind === 'system'}
      <path d="M7 1.2v5.2" />
      <path d="M3.1 3.4a5 5 0 1 0 7.8 0" />
    {:else if kind === 'fixed' || kind === 'globe'}
      <circle cx="7" cy="7" r="5.2" />
      <path d="M1.8 7h10.4M7 1.8c1.6 1.4 2.5 3.2 2.5 5.2S8.6 10.8 7 12.2C5.4 10.8 4.5 9 4.5 7S5.4 3.2 7 1.8Z" />
    {:else if kind === 'switch'}
      <path d="M1.5 4h7.2l-1.8-1.8M8.7 4 6.9 5.8M12.5 10H5.3l1.8 1.8M5.3 10l1.8-1.8" />
    {:else if kind === 'wrench'}
      <path d="M8.3 2.1a3.1 3.1 0 0 0-3.8 3.8L1.3 9.1a1.5 1.5 0 0 0 2.1 2.1L6.6 8a3.1 3.1 0 0 0 3.8-3.8L8.8 5.8 7.1 4.1Z" />
    {:else if kind === 'rule-list'}
      <path d="M4.8 3h7M4.8 7h7M4.8 11h7M1.8 3h.1M1.8 7h.1M1.8 11h.1" />
    {:else if kind === 'pac'}
      <path d="M3 1.5h5l3 3V12.5H3ZM8 1.5v3h3M5 7l-1 1 1 1M8.5 7l1 1-1 1" />
    {:else if kind === 'virtual'}
      <path d="M2 4h6a3 3 0 0 1 3 3v4M8.8 8.8 11 11l2.2-2.2M2 10h3.5" />
    {:else if kind === 'auto-detect'}
      <circle cx="7" cy="7" r="5" /><circle cx="7" cy="7" r="1.8" />
      <path d="M7 1v1.2M7 11.8V13M1 7h1.2M11.8 7H13" />
    {:else}
      <path d="M2 11.5V5.2L7 2l5 3.2v6.3M4.5 11.5V8h5v3.5M1 12.5h12" />
    {/if}
  </svg>
</span>

<style>
  .original-popup-icon {
    display: inline-block;
    width: var(--original-popup-icon-size);
    height: var(--original-popup-icon-size);
    margin-right: 8px;
    color: var(--original-popup-icon-color);
    line-height: var(--original-popup-icon-size);
    vertical-align: -1px;
  }

  .original-popup-icon.trailing {
    margin-right: 0;
    margin-left: 6px;
  }

  .original-popup-icon.options {
    margin-right: 8px;
  }

  svg {
    display: block;
    width: 100%;
    height: 100%;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.55;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
""")

app = Path(app_path).read_text()
replace_import = "  import ProfileIcon from '../../components/ProfileIcon.svelte';\n"
if app.count(replace_import) != 1:
    raise RuntimeError(f'{app_path}: ProfileIcon import mismatch')
app = app.replace(replace_import, "  import OriginalPopupIcon from './OriginalPopupIcon.svelte';\n", 1)
app = app.replace(
    '<ProfileIcon kind={item.kind} color={item.color} size={14} />',
    '<OriginalPopupIcon kind={item.kind} color={item.color} />',
    1,
)
app = app.replace(
    """              <ProfileIcon
                kind={proxyOwnership.externalProfile.kind}
                color={proxyOwnership.externalProfile.kind === 'fixed' ? '#64b5f6' : '#ffb74d'}
                size={14}
              />""",
    """              <OriginalPopupIcon
                kind={proxyOwnership.externalProfile.kind}
                color={proxyOwnership.externalProfile.kind === 'fixed' ? '#64b5f6' : '#ffb74d'}
              />""",
    1,
)
current_block = re.compile(
    r"\n            \{#if sameRoute\(runtime\?\.activeRoute, item\.route\)\}\n              <svg.*?</svg>\n            \{/if\}",
    re.S,
)
app, count = current_block.subn(
    """
            {#if item.kind === 'direct' || item.kind === 'system'}
              <OriginalPopupIcon
                kind="globe"
                color={item.color}
                position="trailing"
              />
            {/if}""",
    app,
    count=1,
)
if count != 1:
    raise RuntimeError(f'{app_path}: active mark block mismatch')
settings_svg = re.compile(r"\n      <svg viewBox=\"0 0 20 20\" aria-hidden=\"true\">.*?</svg>", re.S)
app, count = settings_svg.subn(
    '\n      <OriginalPopupIcon kind="wrench" color="#337ab7" position="options" />',
    app,
    count=1,
)
if count != 1:
    raise RuntimeError(f'{app_path}: settings SVG block mismatch')
Path(app_path).write_text(app)

css = Path(css_path).read_text()
css += """

/* Original active outline and 14px glyph baseline. */
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) .profile-list .profile-row > button.active {
    box-shadow: none;
    outline: 1px auto #101010;
    outline-offset: 1px;
  }
}
"""
Path(css_path).write_text(css)

replace_once(
    capture_path,
    """        profileName:
          '#js-direct > .om-profile-name, #js-system > .om-profile-name, #js-profile-1 > .om-profile-name, #js-profile-2 > .om-profile-name',
        divider: '.om-divider',""",
    """        profileName:
          '#js-direct > .om-profile-name, #js-system > .om-profile-name, #js-profile-1 > .om-profile-name, #js-profile-2 > .om-profile-name',
        profileTrailingIcon:
          '#js-direct > .glyphicon:last-child, #js-system > .glyphicon:last-child',
        divider: '.om-divider',""",
)
replace_once(
    capture_path,
    """        active: '.om-nav-item.om-active > a',
        options: '#js-option',""",
    """        active: '.om-nav-item.om-active > a',
        options: '#js-option',
        optionsIcon: '#js-option > .glyphicon:first-child',""",
)
replace_once(
    capture_path,
    """        profileName: '.profile-name',
        divider: '.profile-divider',""",
    """        profileName: '.profile-name',
        profileTrailingIcon:
          '[data-original-popup-icon="globe"][data-original-popup-icon-position="trailing"]',
        divider: '.profile-divider',""",
)
replace_once(
    capture_path,
    """        active: '.profile-row > button.active',
        options: '.settings-button',""",
    """        active: '.profile-row > button.active',
        options: '.settings-button',
        optionsIcon:
          '[data-original-popup-icon="wrench"][data-original-popup-icon-position="options"]',""",
)

evidence = Path(evidence_path).read_text()
marker = 'Ordinary Head `d24da81362bb3f5c2382e156cb7bf39d54721231` proves the default Popup geometry correction converged.'
if marker not in evidence:
    evidence += """

## Computed geometry result

Ordinary Head `d24da81362bb3f5c2382e156cb7bf39d54721231` proves the default Popup geometry correction converged. All six permanent gates passed. Artifact `8844187403` (`sha256:c8022698db95acb3e9fd4029d1a7b42a311e83f7cd40f19a456f85d671ec2bbc`) shows:

- shell rectangle exactly `x=5, y=10, width=430, height=170` for Original and Nex;
- all four action rectangles, typography, padding, radius, colors and backgrounds match exactly;
- all four name rectangles match within `0.02px` horizontally and exactly vertically;
- divider, Options action and overall vertical rhythm match exactly;
- profile icon rectangles match in size and x position but Nex icons are `1px` low;
- Original active styling uses `outline: auto 1px` with `1px` offset, while Nex used an inset shadow.

The geometry node can therefore move to verified automation. Remaining Popup default differences are icon paths, the missing built-in trailing globe and the active-outline implementation.
"""
Path(evidence_path).write_text(evidence)

Path(icon_evidence_path).write_text("""# Audit Evidence 02M — Popup Icon Compatibility

## Scope

This checkpoint records one bounded clean-room Popup icon correction derived from the official v3.5.0 screenshot, DOM and computed metrics. It is not an acceptance candidate or completion claim.

## Original evidence

The official default Popup uses:

- transfer arrows before `[Direct]` and a gray globe after its label;
- a power glyph before `[System Proxy]` and a black globe after its label;
- a light-blue globe before `proxy`;
- a light-green retweet glyph before `auto switch`;
- a blue wrench before `Options`;
- 14px icon boxes at x `13`, aligned to y `17`, `50`, `86` and `119`.

These shapes and positions are visible in the official paired screenshot and DOM classes. No original font or binary icon asset is copied.

## Clean-room correction

A Popup-specific SVG component now supplies clean-room transfer, power, globe, retweet, wrench and fallback profile glyphs. It preserves route colors and the measured 14px box. Direct and System regain the trailing globe present in the original. The Nex-only current-profile check is removed.

The active action now uses the measured `outline: auto 1px` with `1px` offset rather than an invented inset shadow. Icon baseline moves up by 1px to the original y coordinates.

## Evidence boundary

The permanent paired workflow now records leading icons, built-in trailing icons, the Options icon and computed outline values. A fresh ordinary Head must verify shape placement and preserve all six permanent gates before the default Popup icon slice can be considered automated.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
""")

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        app_path,
        icon_path,
        css_path,
        capture_path,
        evidence_path,
        icon_evidence_path,
    ],
    check=True,
)
