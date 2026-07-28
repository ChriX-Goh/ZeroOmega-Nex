from pathlib import Path
import json


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


# Original schema-v2 keys are +<exact profile name>, not slugs.
fixture_path = Path('fixtures/zeroomega-v2/virtual-reference-migration.json')
fixture = json.loads(fixture_path.read_text())
for old, new in [
    ('+target-proxy', '+Target Proxy'),
    ('+unrelated-proxy', '+Unrelated Proxy'),
    ('+route-matrix', '+Route Matrix'),
    ('+rule-matrix', '+Rule Matrix'),
    ('+pac-matrix', '+PAC Matrix'),
    ('+auto-matrix', '+Auto Matrix'),
    ('+existing-alias', '+Existing Alias'),
]:
    fixture[new] = fixture.pop(old)
fixture_path.write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')

# Auto Detect fallback is a Nex extension field, parallel to the existing PAC fallback extension.
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    '''  const known = new Set([...COMMON_PROFILE_FIELDS, 'pacUrl', 'pacScript', 'lastUpdate', 'sha256']);
  const fields = safeUnknownFields(raw, known, descriptor.path, state.report);
  return { ...profileBase(descriptor, fields), kind: 'auto-detect' };
''',
    '''  const known = new Set([
    ...COMMON_PROFILE_FIELDS,
    'pacUrl',
    'pacScript',
    'lastUpdate',
    'sha256',
    'fallbackProfileName',
  ]);
  const fields = safeUnknownFields(raw, known, descriptor.path, state.report);
  const fallbackName = stringValue(raw.fallbackProfileName);
  if (fallbackName !== undefined) {
    state.report.add(
      'preserved',
      'auto-detect.fallback-nex-extension',
      `${descriptor.path}/fallbackProfileName`,
      'Auto-detect fallback route was restored as a Nex extension field.',
    );
  }
  return {
    ...profileBase(descriptor, fields),
    kind: 'auto-detect',
    ...(fallbackName === undefined
      ? {}
      : {
          fallbackRoute: routeForName(
            fallbackName,
            `${descriptor.path}/fallbackProfileName`,
            state,
          ),
        }),
  };
''',
)

replace_once(
    'packages/legacy-zeroomega/src/export.ts',
    '''  type BypassEntry,
  type Condition,
''',
    '''  type AutoDetectProfile,
  type BypassEntry,
  type Condition,
''',
)
replace_once(
    'packages/legacy-zeroomega/src/export.ts',
    '''function exportVirtual(
''',
    '''function exportAutoDetect(
  state: ExportState,
  profile: AutoDetectProfile,
  path: string,
): MutableJsonObject {
  const result = profileBase(state, profile, path);
  if (profile.fallbackRoute) {
    result.fallbackProfileName = routeName(
      state,
      profile.fallbackRoute,
      `${path}/fallbackProfileName`,
    );
    issue(
      state,
      'warning',
      'auto-detect.fallback-nex-extension',
      `${path}/fallbackProfileName`,
      'Auto-detect fallback route is stored as a Nex extension field; original v3.5.0 ignores it.',
    );
  }
  return result;
}

function exportVirtual(
''',
)
replace_once(
    'packages/legacy-zeroomega/src/export.ts',
    '''    case 'auto-detect':
      return profileBase(state, profile, path);
''',
    '''    case 'auto-detect':
      return exportAutoDetect(state, profile, path);
''',
)

# Round-trip the extension and require an explicit compatibility warning.
replace_once(
    'packages/legacy-zeroomega/src/export.test.ts',
    "  it('preserves Nex-only disabled, regex-flag, PAC-fallback, and per-source interval state', () => {\n",
    "  it('preserves Nex-only disabled, regex-flag, PAC/Auto fallback, and per-source interval state', () => {\n",
)
replace_once(
    'packages/legacy-zeroomega/src/export.test.ts',
    '''        '+rules': {
''',
    '''        '+auto': {
          name: 'auto',
          profileType: 'AutoDetectProfile',
          fallbackProfileName: 'fixed',
        },
        '+rules': {
''',
)
replace_once(
    'packages/legacy-zeroomega/src/export.test.ts',
    '''        'pac.fallback-nex-extension',
        'rule-source.interval-nex-extension',
''',
    '''        'pac.fallback-nex-extension',
        'auto-detect.fallback-nex-extension',
        'rule-source.interval-nex-extension',
''',
)

# Permanent guard and durable scope note.
replace_once(
    'scripts/validate-ui-compatibility.mjs',
    '''      profileOperations.includes('replaceProfileReferencesDraft') &&
      chromiumE2e.includes('virtual-reference-migration.json') &&
''',
    '''      profileOperations.includes('replaceProfileReferencesDraft') &&
      legacyImportImplementation.includes('auto-detect.fallback-nex-extension') &&
      legacyExport.includes('auto-detect.fallback-nex-extension') &&
      chromiumE2e.includes('virtual-reference-migration.json') &&
''',
)

kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg_path.write_text(
    kg_path.read_text()
    + '''
- `AutoDetectProfile.fallbackRoute` 是 Nex typed 兼容字段，不是原版 v3.5.0 消费的标准字段。为避免 schema-v2 备份往返与 Virtual 引用迁移静默丢失，Nex 以 `fallbackProfileName` 扩展字段导入/导出，并始终产生 `auto-detect.fallback-nex-extension` preserved/warning 证据；不得把它宣称为原版浏览器行为。
'''
)
