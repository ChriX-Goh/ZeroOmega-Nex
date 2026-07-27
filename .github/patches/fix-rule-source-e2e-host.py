from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    file.write_text(source.replace(old, new))


replace_once(
    'apps/extension/wxt.config.ts',
    '''} as const;

export default defineConfig({
''',
    '''} as const;

const ruleSourceE2eHostPermissions =
  process.env.ZEROOMEGA_RULE_SOURCE_E2E === '1' ? ['http://127.0.0.1/*'] : [];

export default defineConfig({
''',
)
replace_once(
    'apps/extension/wxt.config.ts',
    '''    optional_host_permissions: ['http://*/*', 'https://*/*'],
    action: {
''',
    '''    optional_host_permissions: ['http://*/*', 'https://*/*'],
    ...(ruleSourceE2eHostPermissions.length === 0
      ? {}
      : { host_permissions: ruleSourceE2eHostPermissions }),
    action: {
''',
)
replace_once(
    '.github/workflows/browser-e2e.yml',
    '''      - name: Build Chromium extension
        run: pnpm build:chromium
''',
    '''      - name: Build Chromium extension
        run: ZEROOMEGA_RULE_SOURCE_E2E=1 pnpm build:chromium
''',
)
