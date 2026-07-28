from pathlib import Path

# ADR-015: imported file PAC is preserved but never activated by browser-only targets.
decisions = Path('docs/DECISIONS.md')
text = decisions.read_text()
anchor = '## ADR template\n'
entry = '''## ADR-015 — Preserve but do not activate local `file:` PAC URLs\n\n**Status:** Accepted\n\n**Decision:** Chromium and Firefox browser-only targets preserve imported PAC Profiles whose source URL uses `file:`, render the original source-backed warnings, and allow the user to clear or replace the URL. They do not read the local file, request file-origin access, install the file URL directly, or silently activate an old cached script. To use the policy, the user must clear the URL and paste the PAC as inline text or expose it through an explicitly permitted HTTP(S) origin.\n\n**Reason:** Nex activation is based on a reproducible, validated `raw-pac/1` snapshot whose script bytes, hash, source revision, installation, and browser confirmation are known before traffic changes. A machine-local path is non-portable across devices, has browser- and user-specific file-access controls, and cannot pass the same bounded background download, compare-and-swap, hashing, and rollback evidence. Directly delegating the path to the browser would create a second unverified activation path.\n\n**Alternatives considered:** Installing the `file:` URL directly through the browser proxy API was rejected because it bypasses the verified snapshot boundary and differs across targets. Requesting broad local-file access and reading the path from the extension was rejected because it adds a high-trust permission for a legacy edge case and still cannot make the path portable. Falling back to a stale cached script was rejected because the UI would claim one source while traffic used another.\n\n**Consequences:** Import/export may retain the non-secret URL for compatibility, but Apply and Popup activation fail before authentication preparation, runtime creation, permission requests, or browser proxy mutation. The Options page keeps the original standalone/referenced warnings and gives the user an explicit conversion path. This is an `INTENTIONAL_DIVERGENCE` from original local-file activation, not a missing implementation.\n\n'''
if text.count(anchor) != 1:
    raise SystemExit(f'expected one ADR template anchor, found {text.count(anchor)}')
decisions.write_text(text.replace(anchor, entry + anchor))

# Strengthen the existing activation regression across both target families and before runtime creation.
test_path = Path('apps/extension/src/lib/profile-workflow-activation.test.ts')
test = test_path.read_text()
start = test.index("  it('rejects top-level PAC file URLs before authentication or browser changes', async () => {")
end = test.index("\n  it('targets Firefox when the runtime driver is Firefox'", start)
replacement = '''  it('rejects top-level PAC file URLs on both targets before authentication, runtime creation, or browser changes', async () => {
    for (const family of ['chromium', 'firefox'] as const) {
      const proxy = new FakeProxyDriver(family);
      const created = runtime(proxy);
      const authentication = new FakeAuthenticationCoordinator();
      const spec = rawPacSpec('file');
      const profile = spec.profiles.find((candidate) => candidate.id === 'profile-raw-pac');
      if (!profile || profile.kind !== 'pac') throw new Error('raw PAC test profile is missing');
      profile.credential = {
        username: 'file-user',
        passwordSecretRef: 'secret-file-pac',
      };
      let runtimeCreated = false;
      const driver = new BrowserProfileWorkflowActivationDriver({
        createRuntime: () => {
          runtimeCreated = true;
          return created.runtime;
        },
        authentication,
      });
      await expect(
        driver.activate(spec, {
          kind: 'profile',
          profileId: 'profile-raw-pac',
        }),
      ).rejects.toThrow('local file URL');
      expect(authentication.preparedBindings).toEqual([]);
      expect(runtimeCreated).toBe(false);
      expect(proxy.installCount).toBe(0);
      expect(proxy.state.value).toEqual(
        family === 'chromium' ? { mode: 'system' } : { proxyType: 'system' },
      );
    }
  });
'''
test_path.write_text(test[:start] + replacement + test[end:])

# UI audit: close original warning parity and split activation into an explicit divergence row.
audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith('| F-02 |'):
        lines[index] = '| F-02 | file URL 警告 | 同上 | 按引用和 target 显示 | MUST_MATCH | DONE | COMPLETE | standalone 与 referenced 警告使用原版中繁文案；脚本隐藏；导入的 `file:` URL 保留且提供清除/转换路径 | 保持双浏览器回归 |'
        break
else:
    raise SystemExit('F-02 row not found')
for index, line in enumerate(lines):
    if line.startswith('| F-11 |'):
        lines.insert(index + 1, '| F-12 | `file:` PAC 激活 | 原版可由浏览器加载本地文件 | 本地路径可直接作为 PAC 来源 | INTENTIONAL_DIVERGENCE | DONE | COMPLETE | ADR-015：Chromium/Firefox 浏览器版保留导入与警告，但不读取或激活本地文件；权限、认证、runtime 与代理状态均在失败前不变化；用户可转换为 inline 或 HTTP(S) | 保持 fail-closed 守卫 |')
        break
else:
    raise SystemExit('F-11 row not found')
audit_path.write_text('\n'.join(lines) + '\n')

# Durable execution status: record the verified Firefox slice and close the file decision.
status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
replacements = {
    '**Current product implementation head:** `7aa8ff15790223131a39b1a5b9813fe66429ba21` — Stable serializable Rule Source/PAC update failures': '**Current product implementation head:** `a997f72054e26071a614d1db5ae8af1129098560` — Firefox optional-origin Rule Source/PAC downloads and read-only status race fix',
    '**Latest integration verification:** run `30395683167` validates the shared fifteen-code contract, secret-safe persistence, cache preservation, full repository verification, and real Chromium HTTP/empty-response failure paths': '**Latest integration verification:** run `30399701709` validates permission denial/non-mutation, real Firefox optional-origin grants, Rule Source/PAC downloads, PAC activation, and the read-only status/mutation-lock race fix',
    '**Last completed exact-Head verification:** `2c31c92a89d665391c87418ba05b0ee41633644d`; CI `30396002670`, Browser E2E `30396002293`, Parity Documentation `30396005041` passed': '**Last completed exact-Head verification:** `b63ddf960ea939b814cfee1ca40ef2361579888f`; CI `30399942785`, Browser E2E `30399942779`, Parity Documentation `30399942787` passed',
    '- Integration run `30399701709`; product commit containing this document. Exact-Head verification is required after the temporary integration workflow is removed.': '- Integration run `30399701709`; product commit `a997f72054e26071a614d1db5ae8af1129098560`; clean exact Head `b63ddf960ea939b814cfee1ca40ef2361579888f` passed CI `30399942785`, Browser E2E `30399942779`, and Parity Documentation `30399942787`.',
    '- real proxy-challenge manual QC and an explicit `file:` PAC target decision,': '- real proxy-challenge manual QC,',
    'Resolve the explicit `file:` PAC target scope, then decide schema-v1/online restore boundaries and prepare consolidated visual plus real-backup owner QC.': 'Decide schema-v1, v1 AutoDetect, and online restore boundaries, then prepare consolidated visual plus real-backup owner QC.',
}
for old, new in replacements.items():
    if status.count(old) != 1:
        raise SystemExit(f'status anchor mismatch: {old[:80]}')
    status = status.replace(old, new)
file_section_anchor = '## Automated acceptance state\n'
file_section = '''### Explicit `file:` PAC target decision\n\n- ADR-015 classifies direct local-file activation as an intentional browser-only divergence rather than an unfinished downloader feature. Imported `file:` URLs and original warnings remain visible and round-trippable, but no local file is read and no stale cache is silently substituted.\n- Both Chromium and Firefox fail before proxy-authentication preparation, runtime creation, optional-origin permission, snapshot installation, or browser proxy mutation. The existing user conversion paths are Clear-to-inline and explicitly permitted HTTP(S).\n- Unit coverage loops both browser families and verifies unchanged system proxy state; the origin-permission boundary separately rejects `file:` without calling `permissions.request`. F-02 warning parity is now DONE and F-12 records the accepted `INTENTIONAL_DIVERGENCE`.\n\n'''
if status.count(file_section_anchor) != 1:
    raise SystemExit('automated acceptance anchor mismatch')
status_path.write_text(status.replace(file_section_anchor, file_section + file_section_anchor))

# Knowledge graph durable edge.
graph_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
graph = graph_path.read_text()
graph += '''\n### `file:` PAC target boundary (ADR-015)\n\n- Original local-file source identity is preserved in imported/exported non-secret configuration and continues to drive the source-backed standalone/referenced warning UI. Preservation is not activation support.\n- The browser-only data plane has one activation invariant: traffic changes only through a reproducible, validated and confirmed snapshot. `file:` paths are machine-local and browser/user permission dependent, so direct URL delegation or extension file reads would create an unverified second data plane.\n- Chromium and Firefox therefore reject a top-level `file:` PAC before authentication preparation, runtime creation, optional-origin permission, snapshot installation and browser proxy mutation. Nested PAC remains unsupported independently.\n- Conversion is explicit: clear the URL and paste the PAC as inline text, or serve it over HTTP(S) and grant only that origin. Silent use of an old cached script is forbidden because displayed source and active traffic policy would diverge.\n'''
graph_path.write_text(graph)

# Parity documentation guard requires the ADR and the new classified row.
validator_path = Path('scripts/validate-parity-docs.mjs')
validator = validator_path.read_text()
validator = validator.replace(
    "const indexPath = 'docs/ORIGINAL_PARITY_MATRIX.md';",
    "const indexPath = 'docs/ORIGINAL_PARITY_MATRIX.md';\nconst decisionsPath = 'docs/DECISIONS.md';\nconst activationTestPath = 'apps/extension/src/lib/profile-workflow-activation.test.ts';",
)
validator = validator.replace(
    "const [graph, audit, index] = await Promise.all([\n  readFile(graphPath, 'utf8'),\n  readFile(auditPath, 'utf8'),\n  readFile(indexPath, 'utf8'),\n]);",
    "const [graph, audit, index, decisions, activationTest] = await Promise.all([\n  readFile(graphPath, 'utf8'),\n  readFile(auditPath, 'utf8'),\n  readFile(indexPath, 'utf8'),\n  readFile(decisionsPath, 'utf8'),\n  readFile(activationTestPath, 'utf8'),\n]);",
)
validator = validator.replace("  'F-09',\n", "  'F-09',\n  'F-12',\n")
insert_anchor = "requireAll('parity index', index, [\n"
extra = """requireAll('file PAC decision', decisions, [
  'ADR-015',
  'Preserve but do not activate local `file:` PAC URLs',
  'INTENTIONAL_DIVERGENCE',
  'silently activate an old cached script',
]);

requireAll('file PAC activation regression', activationTest, [
  "for (const family of ['chromium', 'firefox'] as const)",
  "rejects.toThrow('local file URL')",
  'expect(authentication.preparedBindings).toEqual([])',
  'expect(runtimeCreated).toBe(false)',
  'expect(proxy.installCount).toBe(0)',
]);

"""
if validator.count(insert_anchor) != 1:
    raise SystemExit('parity index validator anchor mismatch')
validator_path.write_text(validator.replace(insert_anchor, extra + insert_anchor))
