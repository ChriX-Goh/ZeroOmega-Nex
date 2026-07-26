from pathlib import Path

path = Path('packages/legacy-zeroomega/src/import.test.ts')
lines = path.read_text().splitlines()
start_matches = [
    index
    for index, line in enumerate(lines)
    if "it('imports Switchy and AutoProxy aliases and decodes embedded base64 lists'" in line
]
end_matches = [
    index
    for index, line in enumerate(lines)
    if "it('reconstructs an original hidden attached Rule List relationship'" in line
]
if len(start_matches) != 1 or len(end_matches) != 1 or start_matches[0] >= end_matches[0]:
    raise SystemExit(
        f'importer test boundaries mismatch: start={start_matches}, end={end_matches}'
    )
start = start_matches[0]
end = end_matches[0]
replacement = [
    "  it('imports Switchy and AutoProxy aliases and decodes embedded base64 lists', async () => {",
    "    const result = importZeroOmegaBackup(await fixture('rule-list-formats.json'), context);",
    "    expect(result.ok).toBe(true);",
    "    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));",
    "    expect(new Set(result.candidate.ruleSources.map((source) => source.format))).toEqual(",
    "      new Set(['switchy', 'autoproxy']),",
    "    );",
    "    expect(codes(result)).toContain('rule-source.base64-decoded');",
    "  });",
    "",
    "  it('preserves downloaded Rule List content as an offline URL cache', () => {",
    "    const cachedContent = '[SwitchyOmega Conditions]\\n\\n*.cached.example.invalid\\n';",
    "    const result = importZeroOmegaBackup(",
    "      {",
    "        schemaVersion: 2,",
    "        '+remote-rules': {",
    "          name: 'remote-rules',",
    "          profileType: 'RuleListProfile',",
    "          format: 'Switchy',",
    "          sourceUrl: 'https://rules.example.invalid/switchy.txt',",
    "          matchProfileName: 'direct',",
    "          defaultProfileName: 'direct',",
    "          ruleList: cachedContent,",
    "        },",
    "      },",
    "      context,",
    "    );",
    "    expect(result.ok).toBe(true);",
    "    if (!result.ok) throw new Error(JSON.stringify(result.report, null, 2));",
    "    expect(codes(result)).toContain('rule-source.downloaded-cache-preserved');",
    "    const source = result.candidate.ruleSources[0];",
    "    expect(source?.location).toEqual({",
    "      kind: 'url',",
    "      url: 'https://rules.example.invalid/switchy.txt',",
    "      content: cachedContent,",
    "    });",
    "  });",
    "",
]
lines[start:end] = replacement
path.write_text('\n'.join(lines) + '\n')
