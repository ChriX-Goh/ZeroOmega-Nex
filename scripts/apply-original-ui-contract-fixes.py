import subprocess
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    source = target.read_text()
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected one match, found {count}: {old!r}')
    target.write_text(source.replace(old, new, 1))


path = 'scripts/capture-original-nex-ui-evidence.mjs'
replace_once(
    path,
    """  mkdir,
  mkdtemp,
  readFile,""",
    """  mkdir,
  mkdtemp,
  readFile,
  readdir,""",
)
replace_once(
    path,
    """async function readManifest(extensionPath) {
  const source = await readTextFile(resolve(extensionPath, 'manifest.json'), 'utf8');
  return JSON.parse(source);
}
""",
    """async function readManifest(extensionPath) {
  const source = await readTextFile(resolve(extensionPath, 'manifest.json'), 'utf8');
  return JSON.parse(source);
}

async function availableLocales(extensionPath) {
  const entries = await readdir(resolve(extensionPath, '_locales'), { withFileTypes: true }).catch(
    () => [],
  );
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}
""",
)
replace_once(
    path,
    """  const manifest = await readManifest(extensionPath);
  const { optionsPath, popupPath } = extensionPages(manifest);""",
    """  const manifest = await readManifest(extensionPath);
  const locales = await availableLocales(extensionPath);
  const { optionsPath, popupPath } = extensionPages(manifest);""",
)
replace_once(
    path,
    """      manifestDefaultLocale: manifest.default_locale ?? null,
    };""",
    """      manifestDefaultLocale: manifest.default_locale ?? null,
      availableLocales: locales,
    };""",
)
replace_once(
    path,
    """normalized anchor targets and page/extension language signals""",
    """normalized anchor targets, page/extension language signals and packaged locale directories""",
)

subprocess.run(['pnpm', 'exec', 'prettier', '--write', path], check=True)
