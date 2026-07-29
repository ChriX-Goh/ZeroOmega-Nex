from pathlib import Path

helper = Path('scripts/e2e-basic-auth-proxy.mjs').read_text()
required_helper_tokens = [
    "import { networkInterfaces } from 'node:os';",
    'function nonLoopbackIpv4()',
    'const targetHost = nonLoopbackIpv4();',
    "await listen(targetServer, '0.0.0.0');",
    "await listen(proxyServer, '127.0.0.1');",
    'directTargetCount',
]
for token in required_helper_tokens:
    if token not in helper:
        raise SystemExit(f'non-loopback proxy target invariant is missing: {token}')

chromium = Path('scripts/e2e-chromium.mjs').read_text()
if '--host-resolver-rules=' in chromium:
    raise SystemExit('Chromium proxy challenge must not map the target back to loopback')

firefox = Path('scripts/e2e-firefox.mjs').read_text()
if 'network.dns.localDomains' in firefox:
    raise SystemExit('Firefox proxy challenge must not map the target back to loopback')

validator = Path('scripts/validate-parity-docs.mjs')
text = validator.read_text()
old = """  'directTargetCount',
  'data-proxy-auth-success',
"""
new = """  'directTargetCount',
  'nonLoopbackIpv4',
  'data-proxy-auth-success',
"""
if text.count(old) != 1:
    raise SystemExit(f'non-loopback validator anchor mismatch: {text.count(old)}')
validator.write_text(text.replace(old, new))
