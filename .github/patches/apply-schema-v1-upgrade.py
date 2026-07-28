from pathlib import Path
import json


def replace_once(path: Path, old: str, new: str, label: str):
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new))

# Contracts expose source schema and stable upgrade notices.
contracts = Path('packages/legacy-zeroomega/src/contracts.ts')
replace_once(
    contracts,
    """export interface LegacyDecodedBackup {
  readonly encoding: LegacyInputEncoding;
  readonly options: Readonly<Record<string, unknown>>;
  readonly stats: LegacyDecodeStats;
}
""",
    """export interface LegacyUpgradeNotice {
  readonly status: Extract<LegacyImportStatus, 'exact' | 'ignored-runtime'>;
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface LegacyDecodedBackup {
  readonly encoding: LegacyInputEncoding;
  readonly sourceSchemaVersion: 1 | 2;
  readonly options: Readonly<Record<string, unknown>>;
  readonly upgrades: readonly LegacyUpgradeNotice[];
  readonly stats: LegacyDecodeStats;
}
""",
    'contracts decoded backup',
)

index_path = Path('packages/legacy-zeroomega/src/index.ts')
replace_once(
    index_path,
    """  LegacyInputEncoding,
  LegacySecretKind,
""",
    """  LegacyInputEncoding,
  LegacyUpgradeNotice,
  LegacySecretKind,
""",
    'index upgrade notice export',
)

# Decoder performs the exact original v3.5.0 upgrade before schema-v2 mapping.
decode = Path('packages/legacy-zeroomega/src/decode.ts')
text = decode.read_text()
text = text.replace(
    """  LegacyInputEncoding,
} from './contracts.js';
""",
    """  LegacyInputEncoding,
  LegacyUpgradeNotice,
} from './contracts.js';
""",
)
anchor = """function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

"""
helpers = r"""function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function switchLikeReferencesAutoDetect(profile: Record<string, unknown>): boolean {
  if (profile.defaultProfileName === 'auto_detect') return true;
  return (
    Array.isArray(profile.rules) &&
    profile.rules.some((rule) => isRecord(rule) && rule.profileName === 'auto_detect')
  );
}

function switchyRuleListReferencesAutoDetect(content: string): boolean {
  let withResult = false;
  for (const rawLine of content.split(/\r?\n/u)) {
    const line = rawLine.trim();
    if (!line || line === '[SwitchyOmega Conditions]') continue;
    if (line === '@with result') {
      withResult = true;
      continue;
    }
    if (!withResult || line.startsWith('@') || line.startsWith('!')) continue;
    const result = /\s+\+([^\s]+)$/u.exec(line);
    if (result?.[1] === 'auto_detect') return true;
  }
  return false;
}

function ruleListReferencesAutoDetect(profile: Record<string, unknown>): boolean {
  if (
    profile.matchProfileName === 'auto_detect' ||
    profile.defaultProfileName === 'auto_detect'
  ) {
    return true;
  }
  if (typeof profile.ruleList !== 'string') return false;
  const profileType = profile.profileType;
  const format = typeof profile.format === 'string' ? profile.format.toLowerCase() : undefined;
  const switchy =
    profileType === 'SwitchyRuleListProfile' ||
    (profileType === 'RuleListProfile' && (format === undefined || format === 'switchy'));
  return switchy && switchyRuleListReferencesAutoDetect(profile.ruleList);
}

function profileReferencesAutoDetect(profile: Record<string, unknown>): boolean {
  switch (profile.profileType) {
    case 'SwitchProfile':
    case 'VirtualProfile':
      return switchLikeReferencesAutoDetect(profile);
    case 'RuleListProfile':
    case 'SwitchyRuleListProfile':
    case 'AutoProxyRuleListProfile':
      return ruleListReferencesAutoDetect(profile);
    default:
      return false;
  }
}

function upgradeOptions(
  input: Record<string, unknown>,
  sourceSchemaVersion: 1 | 2,
): { options: Record<string, unknown>; upgrades: LegacyUpgradeNotice[] } | LegacyDecodeResult {
  let options: Record<string, unknown>;
  try {
    options = structuredClone(input);
  } catch {
    return failure('decode.non-cloneable-object', 'object input must contain cloneable JSON values');
  }

  const upgrades: LegacyUpgradeNotice[] = [];
  if (sourceSchemaVersion === 1) {
    const autoDetectUsed = Object.entries(options).some(
      ([key, value]) => key.startsWith('+') && isRecord(value) && profileReferencesAutoDetect(value),
    );
    if (autoDetectUsed) {
      options['+auto_detect'] = {
        name: 'auto_detect',
        profileType: 'PacProfile',
        pacUrl: 'http://wpad/wpad.dat',
        color: '#00cccc',
      };
      upgrades.push({
        status: 'exact',
        code: 'schema.v1-auto-detect-wpad-created',
        path: '/+auto_detect',
        message: 'Referenced schema-v1 auto_detect was upgraded to the original WPAD PAC profile.',
      });
    }
    options.schemaVersion = 2;
    upgrades.push({
      status: 'exact',
      code: 'schema.v1-upgraded',
      path: '/schemaVersion',
      message: 'ZeroOmega schemaVersion 1 was upgraded to schemaVersion 2.',
    });
  }

  for (const [key, value] of Object.entries(options)) {
    if (!key.startsWith('+') || !isRecord(value) || value.syncOptions !== 'disabled') continue;
    delete value.syncOptions;
    delete value.syncError;
    upgrades.push({
      status: 'ignored-runtime',
      code: 'profile.disabled-sync-state-removed',
      path: `/${key}/syncOptions`,
      message: 'Legacy disabled per-profile sync state was removed during the original upgrade.',
    });
  }

  return { options, upgrades };
}

"""
if text.count(anchor) != 1:
    raise SystemExit(f'decode helper anchor mismatch: {text.count(anchor)}')
text = text.replace(anchor, helpers)
old_tail = """  if (parsed.schemaVersion !== 2) {
    return failure(
      'decode.unsupported-schema',
      'expected ZeroOmega schemaVersion 2',
      '/schemaVersion',
    );
  }

  const resources = inspectResources(parsed, limits);
  if ('ok' in resources) {
    return resources;
  }
  const counts = countProfilesAndRules(parsed, limits);
  if ('ok' in counts) {
    return counts;
  }

  const value: LegacyDecodedBackup = {
    encoding,
    options: parsed,
    stats: {
      byteLength: byteLength || resources.stringBytes,
      nodeCount: resources.nodeCount,
      maxDepth: resources.maxDepth,
      profileCount: counts.profileCount,
      ruleCount: counts.ruleCount,
    },
  };
"""
new_tail = """  const sourceSchemaVersion = parsed.schemaVersion;
  if (sourceSchemaVersion !== 1 && sourceSchemaVersion !== 2) {
    return failure(
      'decode.unsupported-schema',
      'expected ZeroOmega schemaVersion 1 or 2',
      '/schemaVersion',
    );
  }

  const rawResources = inspectResources(parsed, limits);
  if ('ok' in rawResources) return rawResources;
  const upgraded = upgradeOptions(parsed, sourceSchemaVersion);
  if ('ok' in upgraded) return upgraded;
  const resources = inspectResources(upgraded.options, limits);
  if ('ok' in resources) return resources;
  const counts = countProfilesAndRules(upgraded.options, limits);
  if ('ok' in counts) return counts;

  const value: LegacyDecodedBackup = {
    encoding,
    sourceSchemaVersion,
    options: upgraded.options,
    upgrades: upgraded.upgrades,
    stats: {
      byteLength: byteLength || resources.stringBytes,
      nodeCount: resources.nodeCount,
      maxDepth: resources.maxDepth,
      profileCount: counts.profileCount,
      ruleCount: counts.ruleCount,
    },
  };
"""
if text.count(old_tail) != 1:
    raise SystemExit(f'decode tail mismatch: {text.count(old_tail)}')
decode.write_text(text.replace(old_tail, new_tail))

# Import report surfaces the stable upgrade evidence before ordinary mapping.
import_path = Path('packages/legacy-zeroomega/src/import.ts')
replace_once(
    import_path,
    """  const report = new LegacyImportReportBuilder(decoded.value.encoding);
  if (decoded.value.stats.profileCount === 0) {
""",
    """  const report = new LegacyImportReportBuilder(decoded.value.encoding);
  decoded.value.upgrades.forEach((notice) => {
    report.add(notice.status, notice.code, notice.path, notice.message);
  });
  if (decoded.value.stats.profileCount === 0) {
""",
    'import upgrade report',
)

# Decoder tests: schema 1 exact upgrade, direct references, cleanup, immutability, schema 3 rejection.
decode_test = Path('packages/legacy-zeroomega/src/decode.test.ts')
replace_once(
    decode_test,
    """    const wrong = decodeZeroOmegaBackup({ schemaVersion: 1 });
""",
    """    const wrong = decodeZeroOmegaBackup({ schemaVersion: 3 });
""",
    'decode wrong schema test',
)
insert_anchor = """  it('enforces byte, depth, profile, and rule limits', () => {
"""
new_tests = """  it('upgrades schema 1 exactly without mutating object input', () => {
    const input = {
      schemaVersion: 1,
      '+switch': {
        name: 'switch',
        profileType: 'SwitchProfile',
        defaultProfileName: 'direct',
        rules: [
          {
            condition: { conditionType: 'TrueCondition' },
            profileName: 'auto_detect',
          },
        ],
        syncOptions: 'disabled',
        syncError: 'legacy runtime state',
      },
    };
    const original = structuredClone(input);
    const result = decodeZeroOmegaBackup(input);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('expected schema-v1 decode');
    expect(input).toEqual(original);
    expect(result.value.sourceSchemaVersion).toBe(1);
    expect(result.value.options.schemaVersion).toBe(2);
    expect(result.value.options['+auto_detect']).toEqual({
      name: 'auto_detect',
      profileType: 'PacProfile',
      pacUrl: 'http://wpad/wpad.dat',
      color: '#00cccc',
    });
    expect(result.value.options['+switch']).not.toHaveProperty('syncOptions');
    expect(result.value.options['+switch']).not.toHaveProperty('syncError');
    expect(result.value.upgrades.map((notice) => notice.code)).toEqual([
      'schema.v1-auto-detect-wpad-created',
      'schema.v1-upgraded',
      'profile.disabled-sync-state-removed',
    ]);
  });

  it('detects schema-v1 auto_detect references in modern Switchy Rule Lists only when referenced', () => {
    const referenced = decodeZeroOmegaBackup({
      schemaVersion: 1,
      '+rules': {
        name: 'rules',
        profileType: 'RuleListProfile',
        format: 'Switchy',
        matchProfileName: 'direct',
        defaultProfileName: 'direct',
        ruleList:
          '[SwitchyOmega Conditions]\\n@with result\\n\\n*.wpad.example +auto_detect\\n* +direct\\n',
      },
    });
    expect(referenced.ok).toBe(true);
    if (!referenced.ok) throw new Error('expected referenced schema-v1 decode');
    expect(referenced.value.options['+auto_detect']).toBeDefined();

    const unused = decodeZeroOmegaBackup({
      schemaVersion: 1,
      '+proxy': {
        name: 'proxy',
        profileType: 'FixedProfile',
        fallbackProxy: { scheme: 'http', host: '127.0.0.1', port: 7890 },
      },
    });
    expect(unused.ok).toBe(true);
    if (!unused.ok) throw new Error('expected unused schema-v1 decode');
    expect(unused.value.options['+auto_detect']).toBeUndefined();
    expect(unused.value.upgrades.map((notice) => notice.code)).toEqual(['schema.v1-upgraded']);
  });

"""
if decode_test.read_text().count(insert_anchor) != 1:
    raise SystemExit('decode test insertion anchor mismatch')
decode_test.write_text(decode_test.read_text().replace(insert_anchor, new_tests + insert_anchor))

# Source-backed fixture and provenance.
fixture = {
    'schemaVersion': 1,
    '-startupProfileName': 'switch',
    '+proxy': {
        'name': 'proxy',
        'profileType': 'FixedProfile',
        'color': '#99ccee',
        'fallbackProxy': {'scheme': 'http', 'host': '127.0.0.1', 'port': 7890},
    },
    '+switch': {
        'name': 'switch',
        'profileType': 'SwitchProfile',
        'color': '#4488cc',
        'defaultProfileName': 'proxy',
        'rules': [
            {
                'condition': {'conditionType': 'HostWildcardCondition', 'pattern': '*.wpad.example'},
                'profileName': 'auto_detect',
            }
        ],
        'syncOptions': 'disabled',
        'syncError': 'legacy-disabled-state',
    },
}
Path('fixtures/zeroomega-v2/schema-v1-auto-detect.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2) + '\n')
provenance = {
    'sourceRepository': 'zero-peak/ZeroOmega',
    'sourceTag': 'v3.5.0',
    'sourceFile': 'omega-target/src/options.coffee',
    'sourceBehavior': 'Options.upgrade schemaVersion 1 to 2 and synthesize referenced auto_detect as PacProfile http://wpad/wpad.dat #00cccc',
    'capturedFor': 'ZeroOmega Nex M8 schema-v1 importer regression',
}
Path('fixtures/zeroomega-v2/schema-v1-auto-detect.provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')

# Importer test proves final ProfileSpec routes and stable report codes.
import_test = Path('packages/legacy-zeroomega/src/import.test.ts')
anchor = """  it('imports a base64-encoded backup through the full migration pipeline', async () => {
"""
tests = """  it('upgrades the source-backed schema-v1 auto_detect reference to the original WPAD PAC', async () => {
    const source = await fixture('schema-v1-auto-detect.json');
    const result = importZeroOmegaBackup(source, context);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));

    const autoDetect = result.candidate.profiles.find((profile) => profile.name === 'auto_detect');
    expect(autoDetect).toMatchObject({
      kind: 'pac',
      color: '#00cccc',
      source: { kind: 'url', url: 'http://wpad/wpad.dat' },
    });
    const switchProfile = result.candidate.profiles.find((profile) => profile.name === 'switch');
    expect(switchProfile?.kind).toBe('switch');
    if (!autoDetect || autoDetect.kind !== 'pac' || !switchProfile || switchProfile.kind !== 'switch') {
      throw new Error('schema-v1 WPAD fixture did not map expected profiles');
    }
    expect(switchProfile.rules[0]?.route).toEqual({
      kind: 'profile',
      profileId: autoDetect.id,
    });
    expect(codes(result)).toContain('schema.v1-upgraded');
    expect(codes(result)).toContain('schema.v1-auto-detect-wpad-created');
    expect(codes(result)).toContain('profile.disabled-sync-state-removed');
    expect(JSON.stringify(result.candidate)).not.toContain('legacy-disabled-state');
  });

"""
if import_test.read_text().count(anchor) != 1:
    raise SystemExit('import test insertion anchor mismatch')
import_test.write_text(import_test.read_text().replace(anchor, tests + anchor))

# Audit and durable status.
audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith('| G-07 |'):
        lines[index] = '| G-07 | schemaVersion 1 | 同上 | 升级至 2 | MUST_MATCH | DONE | N/A | 按原版 `Options.upgrade` 接受 schema 1、不可变克隆后规范化为 2，并清理 `syncOptions=disabled`/`syncError`；对象、JSON、资源上限与迁移报告测试覆盖 | 保持 source fixture |'
    elif line.startswith('| G-08 |'):
        lines[index] = '| G-08 | v1 auto_detect 升级 | 同上 | PacProfile + WPAD URL | MUST_MATCH | DONE | N/A | 仅当 Switch/Virtual/Rule List 直接引用 `+auto_detect` 时覆盖生成 `PacProfile`：`http://wpad/wpad.dat`、`#00cccc`；source-backed fixture 验证最终 PAC 与引用路由 | 保持原版升级守卫 |'
audit_path.write_text('\n'.join(lines) + '\n')

status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
status = status.replace(
    '- online restore and Gist/WebDAV/browser sync remain explicitly `UNCERTAIN`,',
    '- online restore and Gist/WebDAV/browser sync remain explicitly `UNCERTAIN`,',
)
status = status.replace(
    'Decide schema-v1, v1 AutoDetect, and online restore boundaries, then prepare consolidated visual plus real-backup owner QC.',
    'Decide and implement the online URL restore boundary, then prepare consolidated visual plus real-backup owner QC.',
)
insert_anchor = '## Automated acceptance state\n'
section = '''### Original schema-v1 upgrade and WPAD migration\n\n- Decoder accepts original schema versions 1 and 2. Schema 1 is cloned, upgraded before inventory/mapping, and never mutates an object supplied by the caller; schema 3+ remains rejected.\n- Direct-reference detection follows original inclusive types: Switch and Virtual default/rule results plus Rule List match/default and result-enabled Switchy source routes. A referenced `auto_detect` is overwritten with the original `PacProfile` at `http://wpad/wpad.dat` and color `#00cccc`; an unused name is not synthesized.\n- Original per-profile `syncOptions: disabled` and `syncError` runtime fields are removed for both accepted schema versions. Stable report codes expose the upgrade and cleanup without retaining runtime error text.\n- A source-backed fixture and importer tests verify the final PAC Profile, Switch route, color/URL, report evidence, deterministic IDs, and absence of disabled sync state. G-07 and G-08 are now DONE.\n\n'''
if status.count(insert_anchor) != 1:
    raise SystemExit('status automated acceptance anchor mismatch')
status_path.write_text(status.replace(insert_anchor, section + insert_anchor))

graph_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
graph = graph_path.read_text() + '''\n### Schema-v1 upgrade boundary\n\n- Original v3.5.0 `Options.upgrade` accepts schema 1/2 only. Schema 1 scans inclusive Profile direct references; only a used `+auto_detect` is materialized as `{name: auto_detect, profileType: PacProfile, pacUrl: http://wpad/wpad.dat, color: #00cccc}`, then schemaVersion becomes 2.\n- Inclusive reference evidence includes Switch/Virtual default and rule results plus Rule List result routes. Nex performs this scan before ProfileSpec IDs/routes are generated, so the synthesized PAC participates in ordinary deterministic inventory and references.\n- Profiles with `syncOptions == disabled` lose both `syncOptions` and `syncError`, matching the original runtime cleanup. Input objects are cloned before these changes; migration evidence uses stable report codes.\n'''
graph_path.write_text(graph)

# Permanent parity guard anchors exact fixture and implementation evidence.
validator_path = Path('scripts/validate-parity-docs.mjs')
validator = validator_path.read_text()
validator = validator.replace(
    "const activationTestPath = 'apps/extension/src/lib/profile-workflow-activation.test.ts';",
    "const activationTestPath = 'apps/extension/src/lib/profile-workflow-activation.test.ts';\nconst legacyDecodePath = 'packages/legacy-zeroomega/src/decode.ts';\nconst legacyImportTestPath = 'packages/legacy-zeroomega/src/import.test.ts';\nconst schemaV1FixturePath = 'fixtures/zeroomega-v2/schema-v1-auto-detect.json';",
)
validator = validator.replace(
    "const [graph, audit, index, decisions, activationTest] = await Promise.all([",
    "const [graph, audit, index, decisions, activationTest, legacyDecode, legacyImportTest, schemaV1Fixture] = await Promise.all([",
)
validator = validator.replace(
    "  readFile(activationTestPath, 'utf8'),\n]);",
    "  readFile(activationTestPath, 'utf8'),\n  readFile(legacyDecodePath, 'utf8'),\n  readFile(legacyImportTestPath, 'utf8'),\n  readFile(schemaV1FixturePath, 'utf8'),\n]);",
)
insert_anchor = "requireAll('file PAC decision', decisions, [\n"
extra = """requireAll('schema-v1 decoder', legacyDecode, [
  'schema.v1-auto-detect-wpad-created',
  'schema.v1-upgraded',
  'profile.disabled-sync-state-removed',
  'http://wpad/wpad.dat',
  '#00cccc',
  'switchyRuleListReferencesAutoDetect',
]);

requireAll('schema-v1 importer regression', legacyImportTest, [
  "fixture('schema-v1-auto-detect.json')",
  "url: 'http://wpad/wpad.dat'",
  "color: '#00cccc'",
  "codes(result)).toContain('schema.v1-upgraded')",
]);

requireAll('schema-v1 source fixture', schemaV1Fixture, [
  '"schemaVersion": 1',
  '"profileName": "auto_detect"',
  '"syncOptions": "disabled"',
]);

"""
if validator.count(insert_anchor) != 1:
    raise SystemExit('validator schema insertion anchor mismatch')
validator_path.write_text(validator.replace(insert_anchor, extra + insert_anchor))
