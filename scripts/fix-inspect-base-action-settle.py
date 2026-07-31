from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


path = Path("scripts/e2e-inspect-native-menu.mjs")
text = path.read_text(encoding="utf-8")
old = """  const baseActions = await worker.evaluate(async ({ target, isolation }) => {
    const read = async (tabId) => ({
      badge: await chrome.action.getBadgeText({ tabId }),
      title: await chrome.action.getTitle({ tabId }),
    });
    return { target: await read(target), isolation: await read(isolation) };
  }, tabIds);
  await page.bringToFront();"""
new = """  const baseActions = await eventually(
    () =>
      worker.evaluate(async ({ target, isolation }) => {
        const read = async (tabId) => ({
          badge: await chrome.action.getBadgeText({ tabId }),
          title: await chrome.action.getTitle({ tabId }),
        });
        const loadingTitle = chrome.i18n.getMessage('manifest_icon_default_title');
        const globalTitle = await chrome.action.getTitle({});
        const actions = { target: await read(target), isolation: await read(isolation) };
        return globalTitle !== loadingTitle &&
          actions.target.badge === '' &&
          actions.isolation.badge === '' &&
          actions.target.title === globalTitle &&
          actions.isolation.title === globalTitle
          ? actions
          : undefined;
      }, tabIds),
    'Inspect target and isolation Action baselines did not settle',
  );
  await page.bringToFront();"""
count = text.count(old)
if count != 1:
    raise SystemExit(f"Inspect base Action settle marker: expected one match, found {count}")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
