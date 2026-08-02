import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


capture_path = 'scripts/capture-original-nex-ui-evidence.mjs'
css_path = 'apps/extension/src/entrypoints/options/original-compat.css'
evidence_path = 'docs/AUDIT_EVIDENCE_02K_COMPUTED_LAYOUT_METRICS.md'

replace_once(
    capture_path,
    """          brand: 'header.side-nav > h1',
          navHeading: 'header.side-nav .nav-header',""",
    """          brand: 'header.side-nav > h1',
          brandText: 'header.side-nav > h1 > a',
          navHeading: 'header.side-nav .nav-header',""",
)
replace_once(
    capture_path,
    """          brand: '.side-brand button',
          navHeading: '.nav-group h2',""",
    """          brand: '.side-brand button',
          brandText: '.side-brand button',
          navHeading: '.nav-group h2',""",
)

css = Path(css_path).read_text()
css += """

/* Computed Options residual correction. */
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark']) .sidebar {
    background: #fff;
    border-right: 0;
    box-shadow: none;
  }
}

@media (min-width: 761px) {
  .side-brand button {
    color: #337ab7;
  }

  .editor {
    padding-right: 30px;
  }

  .about-actions a,
  .about-actions button {
    gap: 4px;
  }

  .about-notices {
    margin-top: 8.421875px;
  }

  .about-notices p {
    line-height: 20px;
  }

  .about-license {
    line-height: 20px;
  }

  .about-license p {
    margin: 0;
  }
}
"""
Path(css_path).write_text(css)

replace_once(
    evidence_path,
    """- Original brand: `23.8px / 26.18px`, weight `700`, color `#5c6166`; Nex: `24px / 33.6px`, weight `600`, link blue;""",
    """- the first brand metric targeted the original `h1` container rather than its visible link; screenshot and DOM inspection prove the visible original brand remains link blue, so schema-v2 evidence now records both `brand` and `brandText`;""",
)
replace_once(
    evidence_path,
    """- restores the original brand color, weight and line height;""",
    """- restores the original brand weight and line height while retaining the visible original blue link color;""",
)
replace_once(
    evidence_path,
    """The correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation on Actions-generated commit `af9293df8de7d7808156f41f504027df09d2b33e`. Temporary patch scripts were removed in the same transaction.

This ordinary evidence Head must now regenerate the paired screenshots and schema-v2 metrics. Actual computed positions and styles, not the intended CSS values, determine whether a second adjustment is required.""",
    """The first correction passed architecture, parity, localization, type checking, unit tests, component tests, lint and exact diff validation on Actions-generated commit `af9293df8de7d7808156f41f504027df09d2b33e`. Temporary patch scripts were removed in the same transaction.

Ordinary Head `a08f3eabd05ded2385096bfa9dfb42e854f4e245` proved that navigation headings, links and action controls converged to within `0.02px` vertically and exact font/box metrics. It also proved these residuals:

- the light sidebar remained gray with its border and shadow because the first theme selector did not match the runtime `auto` theme state;
- the visible brand link was incorrectly changed to the parent container's gray color;
- the first notice remained `9.58px` too low;
- the license block retained five separate paragraph margins and measured `121.97px` instead of the original `100px`;
- About action buttons remained approximately `1.1px` too wide;
- the inner content width remained `5px` too wide.

The residual correction uses a light color-scheme selector that excludes explicit dark mode, restores the blue brand link, records a dedicated `brandText` metric, aligns notice and license line/paragraph geometry, reduces the action-icon gap by `1px`, and restores the original inner content width.

A subsequent normal-Head paired artifact must verify the actual residuals before Options is considered visually converged.""",
)

subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', capture_path, css_path, evidence_path],
    check=True,
)
