from pathlib import Path

path = Path('scripts/validate-parity-docs.mjs')
text = path.read_text()
old = """requireAll('proxy authentication permission boundary', proxyPermissionClient, [
  'profileSpecUsesProxyAuthentication',
  'runWithProxyAuthenticationPermission',
  "permissions: ['webRequest', 'webRequestAuthProvider']",
  "permissions: ['webRequest', 'webRequestBlocking']",
  "return { granted: false }",
]);
"""
new = """requireAll('proxy authentication permission boundary', proxyPermissionClient, [
  'profileSpecUsesProxyAuthentication',
  'runWithProxyAuthenticationPermission',
  "['webRequest', 'webRequestAuthProvider']",
  "['webRequest', 'webRequestBlocking']",
  'PROXY_AUTH_PERMISSION_ORIGINS',
  'return { granted: false }',
]);
"""
if text.count(old) != 1:
    raise SystemExit(f'proxy permission validator block mismatch: {text.count(old)}')
path.write_text(text.replace(old, new))
