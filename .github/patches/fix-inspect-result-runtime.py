from pathlib import Path

path = Path('apps/extension/src/lib/inspect-runtime.ts')
text = path.read_text()
old = """  const extensionName = api.i18n?.getMessage('extensionName') || 'ZeroOmega Nex';
  return `${extensionName} — ${current === result ? current : `${current} → ${result}`}`;
"""
new = """  const localizedExtensionName = api.i18n?.getMessage('extensionName');
  const extensionName =
    localizedExtensionName && localizedExtensionName !== 'extensionName'
      ? localizedExtensionName
      : 'ZeroOmega Nex';
  return `${extensionName} — ${current === result ? current : `${current} → ${result}`}`;
"""
if text.count(old) != 1:
    raise SystemExit('route summary extension-name block missing')
text = text.replace(old, new, 1)
old = """    (async (url: string) => {
      const [workflow, activeRoute] = await Promise.all([repository.read(), readActiveRoute()]);
      if (!workflow || !activeRoute) return undefined;
      return evaluateInspectResultPresentation(workflow.applied, activeRoute, url, now());
    });
"""
new = """    (async (url: string) => {
      const workflow = await repository.read();
      if (!workflow) return undefined;
      const activeRoute = await readActiveRoute();
      if (!activeRoute) return undefined;
      return evaluateInspectResultPresentation(workflow.applied, activeRoute, url, now());
    });
"""
if text.count(old) != 1:
    raise SystemExit('default Inspect presentation evaluator block missing')
path.write_text(text.replace(old, new, 1))
