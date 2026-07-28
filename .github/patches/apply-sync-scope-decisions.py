from pathlib import Path

# Append three independent ADRs before the template.
decisions = Path('docs/DECISIONS.md')
text = decisions.read_text()
anchor = '## ADR template\n'
entries = '''## ADR-016 — Defer GitHub Gist synchronization beyond the first browser release\n\n**Status:** Accepted\n\n**Decision:** The first browser-only ZeroOmega Nex replacement does not implement continuous GitHub Gist synchronization. Gist sync is classified as `NOT_PORTING` for Milestone 8 and deferred to a dedicated remote-sync milestone. File import/export and bounded online URL restore remain supported, but neither implies Gist synchronization.\n\n**Reason:** Original v3.5.0 Gist sync is a persistent bidirectional state machine rather than a backup transport. It stores a personal access token, reads commit history, downloads and merges a remote `ZeroOmega.json`, debounces local changes, pushes through the GitHub API, watches for remote commits, and can rebuild local Options plus reapply the startup Profile after conflict resolution. Recreating this safely requires background-owned credentials, explicit remote identity, compare-and-swap commits, conflict UX, retry/rate-limit policy, remote deletion semantics, migration from original state, and dual-browser suspension recovery. Those obligations are materially larger than Milestone 8 import parity.\n\n**Alternatives considered:** Reusing online restore for Gist was rejected because one-shot review cannot provide bidirectional merge or conflict semantics. Persisting the token in ProfileSpec or ordinary settings was rejected because secrets must remain background-owned and absent from exports, command responses, logs, and rendered UI. Shipping a push-only shortcut was rejected because it could overwrite newer remote data while presenting itself as synchronization.\n\n**Consequences:** G-13 is a completed scope decision rather than a missing first-release feature. A later milestone must define a dedicated secret repository, least-privilege GitHub token requirements, remote document schema/version, optimistic concurrency, conflict recovery, bounded scheduling, revocation, deletion, migration, and Chromium/Firefox lifecycle tests before any Gist UI is added.\n\n## ADR-017 — Defer WebDAV synchronization beyond the first browser release\n\n**Status:** Accepted\n\n**Decision:** The first browser-only replacement does not implement continuous WebDAV synchronization. WebDAV sync is classified as `NOT_PORTING` for Milestone 8 and deferred to the same dedicated remote-sync milestone, but it remains a separate backend with separate acceptance criteria.\n\n**Reason:** Original v3.5.0 WebDAV sync creates a `zeroomega/` collection, authenticates with Basic or Bearer credentials, stores a mutable `zeroomega-commit.txt` pointer plus versioned `zeroomega-<commit>.json` files, periodically polls the pointer, replaces local sync storage, pushes a new version, updates the pointer, and deletes the previous file. The protocol is multi-request and not transactionally atomic; interruption can leave orphaned versions or a stale pointer. Original code also accepts HTTP URLs and explicitly lacks Digest authentication. A safe Nex implementation therefore requires HTTPS policy, background-owned credentials, bounded authentication negotiation, path canonicalization, server capability checks, optimistic concurrency, crash recovery, orphan cleanup, conflict UX, and hostile-response limits.\n\n**Alternatives considered:** Copying the original Basic/Bearer implementation directly was rejected because it would expose credentials to a broad UI/storage path and retain non-atomic remote mutation. Treating a WebDAV URL as ordinary online restore was rejected because restore performs local review only and intentionally has no write, watch, or conflict behavior. Supporting only one PUT file without commit identity was rejected because concurrent devices could silently overwrite each other.\n\n**Consequences:** G-14 is a completed first-release scope decision. Any later implementation must be HTTPS-only by default, keep username/password or bearer token in a background-owned secret store, use a documented concurrency protocol, survive partial writes and background suspension, bound every response, and prove interoperability and conflict behavior against controlled WebDAV fixtures on both browser targets. Digest support requires a separate decision.\n\n## ADR-018 — Do not port original credential-bearing browser sync enhancement\n\n**Status:** Accepted\n\n**Decision:** ZeroOmega Nex does not port the original built-in browser-sync mechanism that copies Gist/WebDAV connection configuration into `storage.sync`. This is an `INTENTIONAL_DIVERGENCE`, not a deferred implementation of the same behavior. A future feature may sync non-secret metadata or encrypted envelopes only after a separate cryptographic and recovery design.\n\n**Reason:** Original v3.5.0 writes `gistId`, `gistToken`, `syncUsername`, `syncBackendType`, and `lastGistCommit` into the browser vendor's synchronized storage under `zeroOmegaSync`, then uses cross-device changes to initialize or force remote synchronization. For WebDAV, the field named `gistToken` is the password or bearer token. Copying those plaintext credentials into browser cloud sync violates Nex's background-owned secret boundary and makes credential propagation depend on browser-account sync, vendor retention, quota, device access, and extension storage behavior. It also couples remote-conflict recovery to a second synchronization channel.\n\n**Alternatives considered:** Reproducing the original fields in `storage.sync` was rejected as plaintext credential replication. Syncing secret references without keys was rejected because another device could not resolve them safely. Automatically wrapping secrets with a device-local key was rejected because cross-device decryption, recovery, rotation, account loss, and compromise semantics are undefined.\n\n**Consequences:** G-15 is DONE as an intentional divergence. Production manifests continue to request only ordinary `storage`; no product path writes credentials to browser-synchronized storage. Future browser-native sync, if any, must default to non-secret metadata, define quotas and conflict semantics, and require an explicit encrypted-secret ADR before credentials or recovery material can cross devices.\n\n'''
if text.count(anchor) != 1:
    raise SystemExit(f'ADR template anchor mismatch: {text.count(anchor)}')
decisions.write_text(text.replace(anchor, entries + anchor))

# Close the three audit rows independently.
audit_path = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit_path.read_text().splitlines()
updates = {
    'G-13': '| G-13 | Gist 同步                  | `io.jade`、`io.coffee`、`options_sync.coffee` | 私有 Gist、token、commit、冲突处理 | NOT_PORTING | DONE | N/A | ADR-016：首个浏览器版不实现持续双向 Gist 同步；原版涉及 PAT、commit watch/pull/push、merge、冲突重建和 startup 重新应用，推迟到独立远程同步里程碑 | 后续里程碑重新立项 |',
    'G-14': '| G-14 | WebDAV 同步                | `io.jade`、`io.coffee`、`sync_impl_webdav.coffee` | URL/用户/密码、commit pointer、冲突处理 | NOT_PORTING | DONE | N/A | ADR-017：首版不实现；原版使用 `zeroomega-commit.txt` 与版本文件的多请求协议、Basic/Bearer 凭据且不支持 Digest，未来需 HTTPS、秘密存储、并发与崩溃恢复设计 | 后续里程碑重新立项 |',
    'G-15': '| G-15 | Built-in browser sync      | `options_sync.coffee`、`background.coffee` | 将远程同步配置传播至其他设备 | INTENTIONAL_DIVERGENCE | DONE | N/A | ADR-018：不移植原版把 `gistToken`（Gist token 或 WebDAV 密码）等明文配置写入 `storage.sync` 的机制；未来仅可在独立加密/恢复 ADR 后考虑非秘密元数据或加密信封 | 保持 manifest/storage 守卫 |',
}
seen = set()
for index, line in enumerate(lines):
    for row_id, replacement in updates.items():
        if line.startswith(f'| {row_id} |'):
            lines[index] = replacement
            seen.add(row_id)
if seen != set(updates):
    raise SystemExit(f'missing audit rows: {set(updates) - seen}')
audit_path.write_text('\n'.join(lines) + '\n')

# Durable knowledge graph.
graph_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
graph = graph_path.read_text() + '''\n### Remote synchronization scope boundary (ADR-016–018)\n\n- Original Gist/WebDAV synchronization is not equivalent to import or online restore. It is a persistent bidirectional control plane: remote commit discovery, local merge/push, periodic pull, conflict state, local storage replacement, source refresh, and startup Profile reapplication.\n- Gist uses a GitHub token and commit history around `ZeroOmega.json`. WebDAV emulates commit identity with `zeroomega-commit.txt` and versioned `zeroomega-<commit>.json`; Basic/Bearer credentials are supported, Digest is not, and the multi-request pointer update is not atomic.\n- Nex defers both backends beyond the first browser replacement. A later remote-sync milestone must own credentials in the background, define remote schema and optimistic concurrency, bound scheduling/responses, recover interrupted writes, expose conflict UX, and test background suspension independently on Chromium and Firefox.\n- Original built-in browser sync is a second channel that copies `gistId`, `gistToken`, `syncUsername`, `syncBackendType`, and `lastGistCommit` into browser `storage.sync`. For WebDAV, `gistToken` carries the password/bearer token. Nex intentionally does not port plaintext credential replication to vendor cloud sync.\n- File backup, online URL restore, Gist sync, WebDAV sync, and browser-native sync are five distinct capabilities. Completion of one never implies another.\n'''
graph_path.write_text(graph)

# Update M8 exact checkpoint, remaining closure, and next action.
status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
replacements = {
    '**Last completed exact-Head verification:** `fa24888c1410b94c2d018b7a86f6b79397058013`; CI `30402798827`, Browser E2E `30402798830`, Parity Documentation `30402798803` passed': '**Last completed exact-Head verification:** `e71ef1d71baab380dc1e972eeb787108cef0f207`; CI `30403288077`, Browser E2E `30403287902`, Parity Documentation `30403287912` passed',
    '- Gist/WebDAV/browser sync remain explicitly `UNCERTAIN`,\n': '',
    'Form explicit ADRs for Gist, WebDAV, and browser sync, then prepare consolidated visual plus real-backup owner QC.': 'Prepare consolidated light/dark/zh-CN/zh-TW visual evidence, then stage real proxy-challenge and repository-owner complex-backup QC for one consolidated candidate.',
}
for old, new in replacements.items():
    if status.count(old) != 1:
        raise SystemExit(f'M8 status anchor mismatch: {old[:90]}')
    status = status.replace(old, new)
section_anchor = '## Automated acceptance state\n'
section = '''### Gist, WebDAV, and browser-native sync scope decisions\n\n- ADR-016 closes Gist sync for the first browser release as `NOT_PORTING`, with a dedicated later remote-sync milestone required for PAT ownership, commit CAS, conflict UX, bounded scheduling, migration, revocation, and dual-browser suspension recovery.\n- ADR-017 independently closes WebDAV sync as `NOT_PORTING` for the first release. Future work must be HTTPS-oriented, background-secret-owned, crash-safe across version upload/pointer update/cleanup, response-bounded, and explicit about Basic/Bearer/Digest support.\n- ADR-018 marks original built-in browser sync as an `INTENTIONAL_DIVERGENCE`: Nex does not copy Gist tokens or WebDAV passwords into browser `storage.sync`. Future non-secret or encrypted cross-device synchronization requires a new cryptographic/recovery ADR.\n- G-13, G-14, and G-15 are now DONE scope decisions. File backup and bounded online restore remain separate completed capabilities and do not imply synchronization.\n\n'''
if status.count(section_anchor) != 1:
    raise SystemExit('M8 automated acceptance anchor mismatch')
status_path.write_text(status.replace(section_anchor, section + section_anchor))

# Project-level status now has only human/real-environment closure blockers.
project_path = Path('docs/MILESTONE_STATUS.md')
project = project_path.read_text()
old_blocker = '- Explicit first-release scope decisions for Gist, WebDAV, and browser-native sync.\n'
if project.count(old_blocker) != 1:
    raise SystemExit('project blocker anchor mismatch')
project = project.replace(old_blocker, '')
old_direction = 'The remaining automated scope decision is to classify Gist, WebDAV, and browser-native sync independently. Each requires an explicit ADR covering secret ownership, remote conflict semantics, browser quotas/capabilities, first-release scope, and any later milestone. After those decisions, Milestone 8 moves to consolidated visual evidence, real proxy-challenge QC, repository-owner complex-backup acceptance, and formal candidate preparation.'
new_direction = 'ADR-016–018 close Gist, WebDAV, and browser-native sync for the first browser release. Milestone 8 now moves to consolidated light/dark/zh-CN/zh-TW visual evidence, real proxy-challenge QC, repository-owner complex-backup acceptance, and formal consolidated-candidate preparation.'
if project.count(old_direction) != 1:
    raise SystemExit('project direction anchor mismatch')
project_path.write_text(project.replace(old_direction, new_direction))

# Permanent parity guard for the three independent decisions and production manifest boundary.
validator_path = Path('scripts/validate-parity-docs.mjs')
validator = validator_path.read_text()
validator = validator.replace(
    "const schemaV1FixturePath = 'fixtures/zeroomega-v2/schema-v1-auto-detect.json';",
    "const schemaV1FixturePath = 'fixtures/zeroomega-v2/schema-v1-auto-detect.json';\nconst manifestConfigPath = 'apps/extension/wxt.config.ts';",
)
validator = validator.replace(
    '  schemaV1Fixture,\n] = await Promise.all([',
    '  schemaV1Fixture,\n  manifestConfig,\n] = await Promise.all([',
)
validator = validator.replace(
    "  readFile(schemaV1FixturePath, 'utf8'),\n]);",
    "  readFile(schemaV1FixturePath, 'utf8'),\n  readFile(manifestConfigPath, 'utf8'),\n]);",
)
validator = validator.replace("  'G-02',\n", "  'G-02',\n  'G-13',\n  'G-14',\n  'G-15',\n")
insert_anchor = "requireAll('file PAC decision', decisions, [\n"
extra = """requireAll('remote sync scope decisions', decisions, [
  'ADR-016',
  'Defer GitHub Gist synchronization beyond the first browser release',
  'ADR-017',
  'Defer WebDAV synchronization beyond the first browser release',
  'ADR-018',
  'Do not port original credential-bearing browser sync enhancement',
  'gistToken',
  'zeroomega-commit.txt',
  'INTENTIONAL_DIVERGENCE',
]);

requireAll('remote sync audit rows', audit, [
  '| G-13 | Gist 同步',
  '| NOT_PORTING | DONE |',
  '| G-14 | WebDAV 同步',
  '| G-15 | Built-in browser sync',
  '| INTENTIONAL_DIVERGENCE | DONE |',
]);

requireAll('production manifest storage boundary', manifestConfig, [
  "'storage'",
  "optional_host_permissions: ['http://*/*', 'https://*/*']",
]);
if (manifestConfig.includes('storage.sync') || manifestConfig.includes("'sync'")) {
  failures.push('production manifest/config must not add browser sync storage for credential propagation');
}

"""
if validator.count(insert_anchor) != 1:
    raise SystemExit('validator decision insertion anchor mismatch')
validator_path.write_text(validator.replace(insert_anchor, extra + insert_anchor))
