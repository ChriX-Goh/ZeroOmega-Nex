from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:140]!r}')
    target.write_text(text.replace(old, new, 1))


replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """  'syncError',
]);""",
    """  'syncError',
  'enabled',
]);""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """    ...profileColor(descriptor.raw),
    legacy: legacyMetadata(descriptor.raw, descriptor.profileType, fields),""",
    """    ...profileColor(descriptor.raw),
    ...(typeof descriptor.raw.enabled === 'boolean'
      ? { enabled: descriptor.raw.enabled }
      : {}),
    legacy: legacyMetadata(descriptor.raw, descriptor.profileType, fields),""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """      bypass.push({
        id: legacyStableId('bypass', descriptor.name, String(index), pattern),
        pattern,
      });""",
    """      bypass.push({
        id: legacyStableId('bypass', descriptor.name, String(index), pattern),
        pattern,
        ...(isRecord(entry) && typeof entry.note === 'string' ? { note: entry.note } : {}),
        ...(isRecord(entry) && typeof entry.enabled === 'boolean'
          ? { enabled: entry.enabled }
          : {}),
      });""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """function validRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);""",
    """function validRegex(pattern: string, flags = ''): boolean {
  try {
    new RegExp(pattern, flags);""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """    case 'UrlRegexCondition':
    case 'HostRegexCondition': {
      if (!validRegex(pattern)) {""",
    """    case 'UrlRegexCondition':
    case 'HostRegexCondition': {
      const flags = stringValue(raw.flags) ?? '';
      if (!validRegex(pattern, flags)) {""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """        condition: { kind: url ? 'url-regex' : 'host-regex', pattern },""",
    """        condition: {
          kind: url ? 'url-regex' : 'host-regex',
          pattern,
          ...(flags ? { flags } : {}),
        },""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """      const known = new Set(['condition', 'profileName', 'note']);
      const fields = safeUnknownFields(entry, known, sourcePath, state.report);
      rules.push({""",
    """      const known = new Set(['condition', 'profileName', 'note', 'enabled']);
      const fields = safeUnknownFields(entry, known, sourcePath, state.report);
      const enabled =
        typeof entry.enabled === 'boolean' ? entry.enabled : mapping.enabled;
      rules.push({""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """        ...(mapping.enabled === undefined ? {} : { enabled: mapping.enabled }),""",
    """        ...(enabled === undefined ? {} : { enabled }),""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """  const sourceId = legacyStableId('source', descriptor.name);
  const headerMapping = mapHeaders(raw.headers, `${descriptor.path}/headers`, state);
  state.ruleSources.push({""",
    """  const sourceId = legacyStableId('source', descriptor.name);
  const headerMapping = mapHeaders(raw.headers, `${descriptor.path}/headers`, state);
  const sourceInterval = finiteInteger(raw.updateIntervalMinutes);
  state.ruleSources.push({""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """    updateIntervalMinutes: state.downloadInterval,
  });""",
    """    updateIntervalMinutes:
      sourceInterval !== undefined && sourceInterval >= 1
        ? sourceInterval
        : state.downloadInterval,
  });""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """    'matchProfileName',
    'defaultProfileName',
    'headers',
    'lastUpdate',""",
    """    'matchProfileName',
    'defaultProfileName',
    'headers',
    'updateIntervalMinutes',
    'lastUpdate',""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """    'pacUrl',
    'pacScript',
    'headers',
    'lastUpdate',
    'sha256',
  ]);""",
    """    'pacUrl',
    'pacScript',
    'headers',
    'fallbackProfileName',
    'lastUpdate',
    'sha256',
  ]);""",
)
replace_once(
    'packages/legacy-zeroomega/src/import.ts',
    """    kind: 'pac',
    source,
    ...headerMapping,
  };""",
    """    kind: 'pac',
    source,
    ...headerMapping,
    ...(typeof raw.fallbackProfileName === 'string'
      ? {
          fallbackRoute: routeForName(
            raw.fallbackProfileName,
            `${descriptor.path}/fallbackProfileName`,
            state,
          ),
        }
      : {}),
  };""",
)

index_path = Path('packages/legacy-zeroomega/src/index.ts')
index = index_path.read_text()
index = index.replace(
    "export { importZeroOmegaBackup } from './import.js';\n",
    """export {
  exportZeroOmegaBackup,
  zeroOmegaBackupFilename,
  ZEROOMEGA_BACKUP_MIME_TYPE,
  ZEROOMEGA_BACKUP_SCHEMA_VERSION,
} from './export.js';
export type {
  LegacyExportContext,
  LegacyExportIssue,
  LegacyExportResult,
} from './export.js';
export { importZeroOmegaBackup } from './import.js';
""",
)
index_path.write_text(index)
