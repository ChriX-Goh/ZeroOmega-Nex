from pathlib import Path

ROOT = Path('.')


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {old[:160]!r}')
    path.write_text(text.replace(old, new, 1))


def insert_before(path: Path, anchor: str, addition: str) -> None:
    text = path.read_text()
    count = text.count(anchor)
    if count != 1:
        raise SystemExit(f'{path}: expected one anchor, found {count}: {anchor[:160]!r}')
    path.write_text(text.replace(anchor, addition + anchor, 1))


messages = ROOT / 'apps/extension/src/lib/ui-messages.ts'
keys = """  'autoDetect.help': {
    en: 'Browser auto-detection support depends on the browser target. Choose an explicit fallback for deterministic failure handling.',
    'zh-CN': '浏览器自动检测能力取决于浏览器目标。请选择明确的后备情景模式，以便在检测失败时确定处理方式。',
    'zh-TW': '瀏覽器自動偵測能力取決於瀏覽器目標。請選擇明確的後備情境模式，以便在偵測失敗時確定處理方式。',
  },
  'autoDetect.fallback': {
    en: 'Fallback profile',
    'zh-CN': '后备情景模式',
    'zh-TW': '後備情境模式',
  },
  'autoDetect.fallbackAria': {
    en: 'Profile used when automatic detection fails',
    'zh-CN': '自动检测失败时使用的情景模式',
    'zh-TW': '自動偵測失敗時使用的情境模式',
  },
  'autoDetect.noFallback': {
    en: 'No fallback',
    'zh-CN': '不使用后备情景模式',
    'zh-TW': '不使用後備情境模式',
  },
"""
insert_before(messages, "  'virtual.target.title':", keys)

app = ROOT / 'apps/extension/src/entrypoints/options/App.svelte'
replace_once(
    app,
    """        <AdvancedProfileEditor
          spec={state.draft}
""",
    """        <AdvancedProfileEditor
          {locale}
          spec={state.draft}
""",
)

spec = ROOT / 'apps/extension/src/component-rendering.component.spec.ts'
replace_once(
    spec,
    "import AttachedRuleListConfig from './entrypoints/options/AttachedRuleListConfig.svelte';",
    "import AttachedRuleListConfig from './entrypoints/options/AttachedRuleListConfig.svelte';\n"
    "import AdvancedProfileEditor from './entrypoints/options/AdvancedProfileEditor.svelte';",
)
anchor = """  it('renders the typed Virtual Profile editor in both Chinese locales', () => {
"""
test = """  it('renders the imported Auto Detect editor through the typed catalog', () => {
    const autoDetect = baseSpec();
    autoDetect.profiles.push({
      id: 'auto-detect-component',
      name: '自动检测测试',
      kind: 'auto-detect',
      fallbackRoute: { kind: 'direct' },
    });
    const simplified = render(AdvancedProfileEditor, {
      props: {
        locale: 'zh-CN',
        spec: autoDetect,
        profileId: 'auto-detect-component',
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    }).body;
    expect(simplified).toContain('data-auto-detect-profile-editor');
    expect(simplified).toContain('data-typed-locale="zh-CN"');
    expect(simplified).toContain('自动检测');
    expect(simplified).toContain('后备情景模式');
    expect(simplified).toContain('自动检测失败时使用的情景模式');
    expect(simplified).not.toContain('Browser auto-detection support');
    expect(simplified).not.toContain('Fallback route');

    const traditional = render(AdvancedProfileEditor, {
      props: {
        locale: 'zh-TW',
        spec: autoDetect,
        profileId: 'auto-detect-component',
        disabled: false,
        onReplaceDraft: replaceDraft,
      },
    }).body;
    expect(traditional).toContain('data-typed-locale="zh-TW"');
    expect(traditional).toContain('自動偵測');
    expect(traditional).toContain('後備情境模式');
    expect(traditional).not.toContain('Auto Detect');
  });

"""
insert_before(spec, anchor, test)

inventory = ROOT / 'scripts/generate-locale-inventory.mjs'
replace_once(
    inventory,
    "  'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',",
    "  'apps/extension/src/entrypoints/options/AdvancedProfileEditor.svelte',\n"
    "  'apps/extension/src/entrypoints/options/AttachedRuleListConfig.svelte',",
)
replace_once(
    inventory,
    """function extract(pathname, source) {
""",
    """const formatNames = new Set(['AutoProxy', 'Switchy']);
const keyboardKeys = new Set(['Enter', 'Escape']);
const stableTechnicalCodes = new Set(['ERR_TIMEOUT']);

function classifyCandidate(candidate) {
  const { kind, path: pathname, text } = candidate;
  if (stableTechnicalCodes.has(text)) return 'stable-technical-code';
  if (formatNames.has(text)) return 'format-name';
  if (text === 'URL') return 'standard-technical-term';
  if (keyboardKeys.has(text)) return 'keyboard-key';
  if (text === 'example.com') return 'example-placeholder';
  if (pathname.endsWith('/LegacyImportPanel.svelte') && text.startsWith('; ')) {
    return 'scanner-code-fragment';
  }
  if (kind === 'expression-literal' && /^[a-z][A-Za-z0-9]*$/u.test(text)) {
    return 'source-token';
  }
  return 'user-visible-untranslated';
}

function extract(pathname, source) {
""",
)
replace_once(
    inventory,
    """const inventory = {
  schemaVersion: 1,
  description:
    'Machine-generated candidate inventory of remaining literal English text in Svelte templates. Typed uiText/uiMessage calls are excluded; candidates require human classification before migration.',
  typedBatchFiles,
  candidateCount: candidates.length,
  candidates,
};
""",
    """const classifiedCandidates = candidates.map((candidate) => ({
  ...candidate,
  classification: classifyCandidate(candidate),
}));
const classificationSummary = Object.fromEntries(
  [...new Set(classifiedCandidates.map((candidate) => candidate.classification))]
    .sort()
    .map((classification) => [
      classification,
      classifiedCandidates.filter((candidate) => candidate.classification === classification).length,
    ]),
);
const untranslatedUserVisibleCount =
  classificationSummary['user-visible-untranslated'] ?? 0;
const inventory = {
  schemaVersion: 2,
  description:
    'Machine-generated inventory of literal-English candidates remaining in Svelte templates. Each entry is explicitly classified; typed uiText/uiMessage calls are excluded.',
  typedBatchFiles,
  candidateCount: classifiedCandidates.length,
  untranslatedUserVisibleCount,
  classificationSummary,
  candidates: classifiedCandidates,
};
""",
)
replace_once(
    inventory,
    """  if (existing !== serialized) {
    console.error(`${outputPath} is stale. Run pnpm locale:inventory.`);
    process.exitCode = 1;
  }
""",
    """  if (existing !== serialized) {
    console.error(`${outputPath} is stale. Run pnpm locale:inventory.`);
    process.exitCode = 1;
  }
  if (untranslatedUserVisibleCount > 0) {
    console.error(
      `${outputPath} contains ${untranslatedUserVisibleCount} unclassified user-visible English candidate(s).`,
    );
    for (const candidate of classifiedCandidates.filter(
      (entry) => entry.classification === 'user-visible-untranslated',
    )) {
      console.error(`- ${candidate.path}: ${candidate.text}`);
    }
    process.exitCode = 1;
  }
""",
)

print('Patched Auto Detect catalog, Options wiring, component tests, and locale classification.')
