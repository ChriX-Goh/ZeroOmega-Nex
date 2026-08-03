from pathlib import Path
import subprocess


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


validator_path = 'scripts/validate-ui-compatibility.mjs'
chromium_path = 'scripts/e2e-chromium.mjs'
capture_path = 'scripts/capture-original-nex-ui-evidence.mjs'
css_path = 'apps/extension/src/entrypoints/popup/original-compat.css'
evidence_path = 'docs/AUDIT_EVIDENCE_02M_POPUP_ICON_COMPATIBILITY.md'

replace_once(
    validator_path,
    """    popupApp.includes('import ProfileIcon') &&
      popupApp.includes('normalizedRoutes') &&
      popupApp.includes('applyThemeMode(readThemeMode())'),""",
    """    popupApp.includes("import OriginalPopupIcon from './OriginalPopupIcon.svelte'") &&
      popupApp.includes('<OriginalPopupIcon kind={item.kind} color={item.color} />') &&
      popupApp.includes('normalizedRoutes') &&
      popupApp.includes('applyThemeMode(readThemeMode())'),""",
)

replace_once(
    chromium_path,
    """  assert.equal((await initialPopup.locator('[data-profile-kind]').count()) >= 3, true);""",
    """  assert.equal(
    (await initialPopup.locator('[data-original-popup-icon-position="leading"]').count()) >= 3,
    true,
  );""",
)

replace_once(
    capture_path,
    """        profileIcon: '.profile-row .profile-type-icon',""",
    """        profileIcon:
          '.profile-row [data-original-popup-icon-position="leading"]',""",
)

css = Path(css_path).read_text()
marker = '/* Popup icon contract residual correction. */'
if marker in css:
    raise RuntimeError(f'{css_path}: popup icon residual correction already exists')
css += """

/* Popup icon contract residual correction. */
@media (prefers-color-scheme: light) {
  :root:not([data-theme='dark'])
    [data-original-popup-icon-position='trailing'] {
    margin-left: 0;
  }

  :root:not([data-theme='dark'])
    .settings-button
    > [data-original-popup-icon-position='options'] {
    display: inline-block;
    width: 14px;
    height: 14px;
    margin-right: 8px;
    line-height: 14px;
    vertical-align: -1px;
  }
}
"""
Path(css_path).write_text(css)

evidence = Path(evidence_path).read_text()
marker = 'Ordinary Head `dceea3f0d007ce15d37672358bb535384fcd6ca1` exposed three contract residuals.'
if marker not in evidence:
    evidence += """

## First ordinary-Head result

Ordinary Head `dceea3f0d007ce15d37672358bb535384fcd6ca1` exposed three contract residuals. The paired artifact `8844320098` (`sha256:c5af26520c42fbb6626d6fd4a010591c669fa7f971606f70fa647f309d236e2e`) proved that leading icons and built-in trailing globes render at the intended vertical positions, and the active outline exactly matches Original. It also proved:

- the permanent metric still queried the retired `.profile-type-icon`, so leading icon metrics were empty;
- the generic `.settings-button span` compatibility rule overrode the component root, stretching the wrench across the row and moving `Options` to the next line;
- the trailing globe retained an unnecessary 6px margin because the clean-room bracket glyph widths differ from the original font rendering.

CI failed only because its static icon guard still required the retired `ProfileIcon` import. Chromium E2E failed only because its icon-count assertion still queried `[data-profile-kind]`. Firefox, native Chromium Inspect, paired evidence, Toolbar evidence, visual evidence and parity documentation passed.

The residual correction updates both permanent contracts to the Popup-specific icon data attributes, restores the wrench to a 14px inline box and removes the trailing margin so the globe x positions match Original. A fresh ordinary Head is required; no rerun of the failed Head counts as evidence.
"""
Path(evidence_path).write_text(evidence)

subprocess.run(
    [
        'pnpm',
        'exec',
        'prettier',
        '--write',
        validator_path,
        chromium_path,
        capture_path,
        css_path,
        evidence_path,
    ],
    check=True,
)
