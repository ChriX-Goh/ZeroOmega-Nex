from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one anchor, found {count}')
    path.write_text(text.replace(old, new))

# C-08 closes only the supported HTTP(S) authentication path; SOCKS remains C-09 capability scope.
audit = Path('docs/UI_AUDIT_MATRIX.md')
lines = audit.read_text().splitlines()
for index, line in enumerate(lines):
    if line.startswith('| C-08 |'):
        lines[index] = '| C-08 | 每 scheme 认证     | `fixed_auth_edit.jade`   | 锁形按钮打开认证编辑                        | MUST_MATCH | DONE     | COMPLETE | 对话框、后台秘密存储、用户名初始焦点与权限 fail-closed 已验证；受控 Basic 代理在 Chromium/Firefox 均真实返回 407，扩展经 `onAuthRequired` 提供凭据后目标页面成功加载；原始授权头不记录/不输出 | 保持双浏览器 407 回归 |'
        break
else:
    raise SystemExit('C-08 audit row not found')
audit.write_text('\n'.join(lines) + '\n')

# Durable product/data-plane graph.
graph = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
graph.write_text(
    graph.read_text()
    + '''\n### Real proxy 407 authentication boundary\n\n- Supported Fixed HTTP/HTTPS credentials are saved through the Options authentication dialog as `{username, passwordSecretRef}` plus background-owned secret material. ProfileSpec, ordinary exports, logs, rendered UI, and E2E telemetry never contain the password value after the save command.\n- Every UI path that can Apply a credential-bearing candidate requests the browser-specific optional authentication permission inside the originating user gesture. Chromium requires `webRequest` + `webRequestAuthProvider`; Firefox requires `webRequest` + `webRequestBlocking`; both require HTTP(S) origins. Denial returns before import, Apply, or proxy mutation.\n- A controlled local HTTP proxy proves the complete browser data plane. It emits a real `407 Proxy Authentication Required` with a Basic challenge, accepts only the expected `Proxy-Authorization`, and returns a marked target document without forwarding or DNS. The helper records counts only and never stores or prints the authorization value.\n- Chromium and Firefox configure `127.0.0.1:<dynamic port>` through their real localized Fixed UI, save a secret, Apply, activate through Popup, navigate an ordinary HTTP target, observe at least one 407, and require a subsequent authorized target request.\n- The handler still fails closed for website authentication, unsupported schemes, ambiguous bindings, missing secrets, repeated attempts, and SOCKS authentication. SOCKS/target capability remains C-09 rather than weakening C-08 HTTP(S) closure.\n'''
)

status = Path('docs/MILESTONE_8_STATUS.md')
text = status.read_text()
anchor = '## Automated acceptance state\n'
section = '''### Real Chromium and Firefox proxy-407 challenge\n\n- Apply-capable Options paths now route credential-bearing ProfileSpec candidates through one fail-closed optional-permission helper before any command or browser mutation. Permission denial has direct unit coverage and never invokes the guarded action.\n- A shared controlled HTTP proxy emits a genuine Basic `407 Proxy Authentication Required`, compares authorization without retaining it, and returns a marked success document only after valid credentials. Its public evidence is bounded request counts, never the password or authorization header.\n- Chromium and Firefox both configure the dynamic localhost endpoint and credentials through the actual localized Fixed Profile UI, Apply through the ordinary verified transaction, confirm the target-specific browser permissions, activate through Popup, and load the ordinary HTTP target through the authenticated proxy.\n- Both regressions require at least one 407 plus an authorized target request. C-08 is DONE for supported HTTP/HTTPS authentication; SOCKS authentication remains explicitly unsupported under C-09.\n\n'''
if text.count(anchor) != 1:
    raise SystemExit('M8 automated acceptance anchor mismatch')
text = text.replace(anchor, section + anchor)
replace_pairs = {
    '- real proxy-challenge manual QC,\n': '',
    'Attempt to close the real proxy 407 challenge through controlled Chromium/Firefox E2E; then stage repository-owner visual and real complex-backup QC for one consolidated candidate.': 'Prepare one consolidated owner-QC candidate for visual-artifact review and a real complex ZeroOmega backup; do not request installation of intermediate slices.',
}
for old, new in replace_pairs.items():
    if text.count(old) != 1:
        raise SystemExit(f'M8 closure anchor mismatch: {old[:80]}')
    text = text.replace(old, new)
status.write_text(text)

project = Path('docs/MILESTONE_STATUS.md')
text = project.read_text()
if text.count('- Real proxy-challenge manual QC.\n') != 1:
    raise SystemExit('project proxy blocker anchor mismatch')
text = text.replace('- Real proxy-challenge manual QC.\n', '')
delivered_anchor = '- Exact-Head visual evidence: light/dark × zh-CN/zh-TW across Options General, Fixed Profile, Import/Export, Popup, Temporary Rules, and Network, with 24 per-image hashes plus artifact/manifest digests.\n'
if text.count(delivered_anchor) != 1:
    raise SystemExit('project visual delivered anchor mismatch')
text = text.replace(
    delivered_anchor,
    delivered_anchor
    + '- Real Chromium/Firefox Basic proxy authentication: localized UI credential save, permission grant, verified Apply/activation, genuine 407 challenge, `onAuthRequired` response, and successful target navigation.\n',
)
old_direction = 'The exact-Head visual matrix is generated and integrity-checked. Milestone 8 now attempts controlled Chromium/Firefox proxy-407 challenge coverage, then moves to repository-owner visual/complex-backup acceptance and formal consolidated-candidate preparation.'
new_direction = 'The exact-Head visual matrix and controlled Chromium/Firefox proxy-407 path are automated and integrity-checked. Milestone 8 now moves to one repository-owner visual/complex-backup acceptance pass and formal consolidated-candidate preparation.'
if text.count(old_direction) != 1:
    raise SystemExit('project 407 direction anchor mismatch')
project.write_text(text.replace(old_direction, new_direction))

# Permanent evidence guard.
validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
text = text.replace(
    "const visualEvidenceWorkflowPath = '.github/workflows/m8-visual-evidence.yml';",
    "const visualEvidenceWorkflowPath = '.github/workflows/m8-visual-evidence.yml';\nconst proxyPermissionClientPath = 'apps/extension/src/lib/proxy-auth-permission-client.ts';\nconst proxyChallengeServerPath = 'scripts/e2e-basic-auth-proxy.mjs';\nconst chromiumE2ePath = 'scripts/e2e-chromium.mjs';\nconst firefoxE2ePath = 'scripts/e2e-firefox.mjs';",
)
text = text.replace(
    '  visualEvidenceWorkflow,\n] = await Promise.all([',
    '  visualEvidenceWorkflow,\n  proxyPermissionClient,\n  proxyChallengeServer,\n  chromiumE2e,\n  firefoxE2e,\n] = await Promise.all([',
)
text = text.replace(
    "  readFile(visualEvidenceWorkflowPath, 'utf8'),\n]);",
    "  readFile(visualEvidenceWorkflowPath, 'utf8'),\n  readFile(proxyPermissionClientPath, 'utf8'),\n  readFile(proxyChallengeServerPath, 'utf8'),\n  readFile(chromiumE2ePath, 'utf8'),\n  readFile(firefoxE2ePath, 'utf8'),\n]);",
)
insert = "requireAll('file PAC decision', decisions, [\n"
extra = """requireAll('proxy authentication permission boundary', proxyPermissionClient, [
  'profileSpecUsesProxyAuthentication',
  'runWithProxyAuthenticationPermission',
  "permissions: ['webRequest', 'webRequestAuthProvider']",
  "permissions: ['webRequest', 'webRequestBlocking']",
  "return { granted: false }",
]);

requireAll('controlled proxy challenge server', proxyChallengeServer, [
  '407',
  'proxy-authenticate',
  'Basic realm="ZeroOmega Nex E2E"',
  'timingSafeEqual',
  'targetAuthorizedCount',
  'data-proxy-auth-success',
]);

requireAll('Chromium real proxy challenge', chromiumE2e, [
  "createBasicAuthProxyChallengeServer",
  "permissions: ['webRequest', 'webRequestAuthProvider']",
  'Chromium proxy never emitted a real 407 challenge',
  'targetAuthorizedCount >= 1',
]);

requireAll('Firefox real proxy challenge', firefoxE2e, [
  "createBasicAuthProxyChallengeServer",
  "permissions: ['webRequest', 'webRequestBlocking']",
  'Firefox proxy never emitted a real 407 challenge',
  'targetAuthorizedCount >= 1',
]);

const fixedAuthRow = audit.split('\\n').find((line) => line.startsWith('| C-08 '));
if (!fixedAuthRow || !fixedAuthRow.includes('| DONE') || !fixedAuthRow.includes('407')) {
  failures.push('C-08 must remain DONE with real 407 evidence');
}

"""
if text.count(insert) != 1:
    raise SystemExit('proxy validator insertion anchor mismatch')
validator.write_text(text.replace(insert, extra + insert))
