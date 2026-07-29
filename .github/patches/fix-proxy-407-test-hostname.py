from pathlib import Path

helper = Path('scripts/e2e-basic-auth-proxy.mjs')
text = helper.read_text()
text = text.replace("import { networkInterfaces } from 'node:os';\n", '')
old_function = """function nonLoopbackIpv4() {
  for (const values of Object.values(networkInterfaces())) {
    for (const value of values ?? []) {
      if (value.family === 'IPv4' && !value.internal) return value.address;
    }
  }
  throw new Error('Proxy authentication E2E requires a non-loopback IPv4 address');
}

"""
if text.count(old_function) != 1:
    raise SystemExit(f'nonLoopbackIpv4 block mismatch: {text.count(old_function)}')
text = text.replace(old_function, '')
text = text.replace(
    "function safeEqual(left, right) {",
    "export const PROXY_AUTH_TARGET_HOST = 'zeroomega-auth-target.test';\n\nfunction safeEqual(left, right) {",
)
old_target = """  const targetPath = `/auth-check/${crypto.randomUUID()}`;
  const targetHost = nonLoopbackIpv4();
  let directTargetCount = 0;
"""
new_target = """  const targetPath = `/auth-check/${crypto.randomUUID()}`;
  const targetHost = PROXY_AUTH_TARGET_HOST;
  let directTargetCount = 0;
"""
if text.count(old_target) != 1:
    raise SystemExit(f'target host block mismatch: {text.count(old_target)}')
text = text.replace(old_target, new_target)
text = text.replace("  await listen(targetServer, '0.0.0.0');", "  await listen(targetServer, '127.0.0.1');")
helper.write_text(text)

chromium = Path('scripts/e2e-chromium.mjs')
text = chromium.read_text()
old_import = "import { createBasicAuthProxyChallengeServer } from './e2e-basic-auth-proxy.mjs';"
new_import = """import {
  createBasicAuthProxyChallengeServer,
  PROXY_AUTH_TARGET_HOST,
} from './e2e-basic-auth-proxy.mjs';"""
if text.count(old_import) != 1:
    raise SystemExit(f'Chromium proxy helper import mismatch: {text.count(old_import)}')
text = text.replace(old_import, new_import)
old_args = """    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
"""
new_args = """    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      `--host-resolver-rules=MAP ${PROXY_AUTH_TARGET_HOST} 127.0.0.1`,
    ],
"""
if text.count(old_args) < 1:
    raise SystemExit('Chromium launch args anchor is missing')
text = text.replace(old_args, new_args, 1)
chromium.write_text(text)

firefox = Path('scripts/e2e-firefox.mjs')
text = firefox.read_text()
if text.count(old_import) != 1:
    raise SystemExit(f'Firefox proxy helper import mismatch: {text.count(old_import)}')
text = text.replace(old_import, new_import)
old_pref = """  .setPreference('network.dns.disableIPv6', true)
  .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));
"""
new_pref = """  .setPreference('network.dns.disableIPv6', true)
  .setPreference('network.dns.localDomains', PROXY_AUTH_TARGET_HOST)
  .setPreference('extensions.webextensions.uuids', JSON.stringify({ [addonId]: extensionUuid }));
"""
if text.count(old_pref) != 1:
    raise SystemExit(f'Firefox DNS preference anchor mismatch: {text.count(old_pref)}')
firefox.write_text(text.replace(old_pref, new_pref))

validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
old = """  'directTargetCount',
  'data-proxy-auth-success',
"""
new = """  'directTargetCount',
  "PROXY_AUTH_TARGET_HOST = 'zeroomega-auth-target.test'",
  'data-proxy-auth-success',
"""
if text.count(old) != 1:
    raise SystemExit(f'proxy hostname validator anchor mismatch: {text.count(old)}')
validator.write_text(text.replace(old, new))
