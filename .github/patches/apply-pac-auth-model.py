from pathlib import Path
import json


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:180]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'packages/profile-spec/src/types.ts',
    '''export interface PacProfile extends ProfileBase {
  readonly kind: 'pac';
  source: PacSource;
  fallbackRoute?: ProfileRouteTarget;
  headers?: RuleSourceHeader[];
}
''',
    '''export interface PacProfile extends ProfileBase {
  readonly kind: 'pac';
  source: PacSource;
  fallbackRoute?: ProfileRouteTarget;
  headers?: RuleSourceHeader[];
  credential?: ProxyCredentialRef;
}
''',
)

schema_path = Path('packages/profile-spec/schema/profile-spec-v1.schema.json')
schema = json.loads(schema_path.read_text())
pac_schema = next(
    item
    for item in schema['$defs']['profile']['oneOf']
    if item.get('properties', {}).get('kind', {}).get('const') == 'pac'
)
pac_schema['properties']['credential'] = {
    'type': 'object',
    'additionalProperties': False,
    'required': ['passwordSecretRef'],
    'properties': {
        'username': {'type': 'string'},
        'passwordSecretRef': {'$ref': '#/$defs/identifier'},
    },
}
schema_path.write_text(json.dumps(schema, ensure_ascii=False, indent=2) + '\n')

# Legacy import auth.all -> background-owned PAC credential.
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    '''  const raw = descriptor.raw;
  const pacUrl = stringValue(raw.pacUrl);
''',
    '''  const raw = descriptor.raw;
  const auth = isRecord(raw.auth) ? raw.auth : undefined;
  if (auth) {
    for (const slot of Object.keys(auth)) {
      if (slot !== 'all') {
        state.report.add(
          'rejected',
          'secret.unknown-pac-auth-slot',
          `${descriptor.path}/auth/${slot}`,
          'PAC authentication supports only the legacy auth.all credential.',
        );
      }
    }
  }
  const credential = extractProxyCredential(auth, 'all', 'http', descriptor.path, state);
  const pacUrl = stringValue(raw.pacUrl);
''',
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    '''    'headers',
    'fallbackProfileName',
''',
    '''    'headers',
    'auth',
    'fallbackProfileName',
''',
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    '''    source,
    ...headerMapping,
''',
    '''    source,
    ...headerMapping,
    ...(credential === undefined ? {} : { credential }),
''',
)

# Ordinary backups omit PAC credentials explicitly.
replace_once(
    'packages/legacy-zeroomega/src/export.ts',
    '''function exportPac(state: ExportState, profile: PacProfile, path: string): MutableJsonObject {
  const result = profileBase(state, profile, path);
''',
    '''function exportPac(state: ExportState, profile: PacProfile, path: string): MutableJsonObject {
  const result = profileBase(state, profile, path);
  if (profile.credential) {
    issue(
      state,
      'warning',
      'secret.pac-credential-omitted',
      `${path}/auth/all`,
      'All-proxy PAC authentication credentials were omitted from the ordinary backup.',
    );
    state.omittedSecretCount += 1;
  }
''',
)

# Secret reference lookups include PAC credentials.
replace_once(
    'packages/profile-workflow/src/commands.ts',
    '''  for (const profile of spec.profiles) {
    if (
      profile.kind === 'pac' &&
      profile.headers?.some(
''',
    '''  for (const profile of spec.profiles) {
    if (profile.kind === 'pac' && profile.credential?.passwordSecretRef === secretRef) return true;
    if (
      profile.kind === 'pac' &&
      profile.headers?.some(
''',
)
