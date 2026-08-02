import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


css_path = 'apps/extension/src/entrypoints/options/original-compat.css'
evidence_path = 'docs/AUDIT_EVIDENCE_02K_COMPUTED_LAYOUT_METRICS.md'

css = Path(css_path).read_text()
css += """

/* Computed Original ↔ Nex metrics — Options light baseline. */
.app-shell {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 14px;
  color: #333;
}

:root[data-theme='light'] .sidebar {
  background: #fff;
  border-right: 0;
  box-shadow: none;
}

@media (min-width: 761px) {
  .side-brand {
    padding: 20px 0 0 30px;
  }

  .side-brand button {
    width: 210px;
    color: #5c6166;
    font-size: 23.8px;
    font-weight: 700;
    line-height: 26.18px;
  }

  .side-navigation {
    padding: 0 0 24px 30px;
  }

  .nav-group {
    padding: 0;
    border-top: 0;
  }

  .nav-group:first-child {
    padding-top: 35.6875px;
  }

  .nav-group + .nav-group {
    margin-top: 2px;
    padding-top: 9px;
    border-top: 1px solid #e5e5e5;
  }

  .nav-group h2 {
    width: 240px;
    height: 26px;
    margin: 0 0 2px -15px;
    padding: 3px 15px;
    font-size: 11px;
    font-weight: 700;
    line-height: 20px;
  }

  .nav-group > button {
    width: 210px;
    min-height: 0;
    padding: 8px 15px;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
  }

  .nav-group > button + button {
    margin-top: 2px;
  }

  .nav-group.actions > button {
    background: #fff;
    font-weight: 400;
  }

  .nav-group.actions > button.discard {
    color: #777;
    background: transparent;
    border: 0;
  }

  .editor {
    padding-top: 20px;
  }

  .original-about-page .editor-heading {
    margin-bottom: 37px;
  }

  .original-about-page .editor-heading h1 {
    margin: 0;
    font-weight: 500;
    line-height: 33px;
  }

  .about-product {
    margin: 14px 0;
  }

  .about-product p {
    margin: 0 0 4px;
  }

  .about-notices p {
    margin-bottom: 10px;
  }

  .about-license {
    margin-top: 98px;
  }
}
"""
Path(css_path).write_text(css)

Path(evidence_path).write_text("""# Audit Evidence 02K — Computed Layout Metrics

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

The correction must pass architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation in the atomic finalizer. A subsequent normal-Head paired artifact must verify the actual computed positions and styles before any further visual adjustment.

Project progress remains 48%; Order 1 remains 45%; the latest owner result remains FAIL; no candidate, merge, release or owner retest is authorized.
""")

subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', css_path, evidence_path],
    check=True,
)
