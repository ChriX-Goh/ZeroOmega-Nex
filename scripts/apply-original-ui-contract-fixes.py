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
    "brandText: '.side-brand button',",
    "brandText: '.side-brand button > span',",
)

css = Path(css_path).read_text()
css += """

/* Final computed Options vertical residual. */
@media (min-width: 761px) {
  .about-actions {
    margin-bottom: 6.421875px;
  }

  .about-actions > * {
    line-height: 20px;
  }

  .about-notices {
    margin-top: 6.421875px;
  }
}
"""
Path(css_path).write_text(css)

replace_once(
    evidence_path,
    """A subsequent normal-Head paired artifact must verify the actual residuals before Options is considered visually converged.""",
    """Ordinary Head `5be036c1010b5a0d326144a7bea3b0148f4d1a8e` proves the residual correction succeeded for the sidebar, brand color, content width, action widths and license height. Navigation and action geometry remain within `0.02px` of Original; the visible brand text now has the exact original font, line height, weight and blue color.

One final vertical residual remains: all three notices and the license block are `5.58px` low. Computed margins prove that the `12px` bottom margin on the action container wins the adjacent-margin collapse, preventing the smaller notice margin from taking effect. Both adjacent margins are therefore set to `6.421875px`, and action line height is fixed at `20px`. The Nex `brandText` selector now targets the internal text span instead of the full-width button.

A subsequent normal-Head paired artifact must confirm the final Options vertical residual before work moves to Popup presentation.""",
)

subprocess.run(
    ['pnpm', 'exec', 'prettier', '--write', capture_path, css_path, evidence_path],
    check=True,
)
