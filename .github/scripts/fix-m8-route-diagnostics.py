from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new, 1))


options = Path('apps/extension/src/entrypoints/options/App.svelte')
replace_once(
    options,
    '{:else if selectedProfile}',
    '{:else if selectedProfile && state}',
    'Options state narrowing',
)

operations = Path('packages/profile-workflow/src/profile-operations.ts')
replace_once(
    operations,
    "  const endpointId = idFactory('endpoint');\n  const profile: FixedProfile = {",
    "  const endpointId = idFactory('endpoint');\n  const color =\n    PROFILE_COLORS[draft.profiles.length % PROFILE_COLORS.length] ?? PROFILE_COLORS[0];\n  const profile: FixedProfile = {",
    'Fixed Profile color initialization',
)
replace_once(
    operations,
    '    color: PROFILE_COLORS[draft.profiles.length % PROFILE_COLORS.length],',
    '    color,',
    'Fixed Profile color assignment',
)

package_json = Path('apps/extension/package.json')
replace_once(
    package_json,
    '    "@zeroomega-nex/core-contracts": "workspace:*",\n    "@zeroomega-nex/profile-spec": "workspace:*",',
    '    "@zeroomega-nex/core-contracts": "workspace:*",\n    "@zeroomega-nex/pac-compiler": "workspace:*",\n    "@zeroomega-nex/profile-spec": "workspace:*",',
    'extension pac-compiler dependency',
)

lockfile = Path('pnpm-lock.yaml')
replace_once(
    lockfile,
    "      '@zeroomega-nex/core-contracts':\n        specifier: workspace:*\n        version: link:../../packages/core-contracts\n      '@zeroomega-nex/profile-spec':",
    "      '@zeroomega-nex/core-contracts':\n        specifier: workspace:*\n        version: link:../../packages/core-contracts\n      '@zeroomega-nex/pac-compiler':\n        specifier: workspace:*\n        version: link:../../packages/pac-compiler\n      '@zeroomega-nex/profile-spec':",
    'extension pac-compiler lock entry',
)
