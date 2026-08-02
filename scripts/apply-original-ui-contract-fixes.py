from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


replace_once(
    'scripts/validate-ui-compatibility.mjs',
    """  [
    popupStyle.includes('width: 320px'),
    'Popup width must remain deterministic and provide room for larger icons.',
  ],""",
    """  [
    popupStyle.includes('width: 440px') &&
      !popupStyle.includes('width: 320px') &&
      popupApp.includes('sameRoute(runtime?.activeRoute, item.route)') &&
      chromiumE2e.includes(
        'Inactive default Switch exposed a result selector in the System Popup state',
      ) &&
      firefoxE2e.includes(
        'Inactive default Switch exposed a result selector in the Direct Popup state',
      ),
    'Popup width and inactive result controls must follow the paired original default evidence.',
  ],""",
)
