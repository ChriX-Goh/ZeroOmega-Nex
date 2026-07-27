from pathlib import Path

path = Path('apps/extension/src/component-rendering.component.spec.ts')
text = path.read_text()
old = "    expect(body).toContain(\"function FindProxyForURL() { return &#39;DIRECT&#39;; }\");"
new = "    expect(body).toContain(\"function FindProxyForURL() { return 'DIRECT'; }\");"
if text.count(old) != 1:
    raise SystemExit(f'expected one escaped PAC script assertion, found {text.count(old)}')
path.write_text(text.replace(old, new, 1))
