from pathlib import Path

script = Path('scripts/owner-corpus-b-intake.mjs')
source = script.read_text()

old = """function ruleListShape(value) {
  if (typeof value !== 'string') return '<non-string>';
  const result = { lines: 0, blank: 0, comments: 0, exceptions: 0, regex: 0, rules: 0 };
  for (const line of value.split(/\\r?\\n/u)) {
    result.lines += 1;
    const item = line.trim();
    if (!item) result.blank += 1;
    else if (item.startsWith('!') || item.startsWith('[')) result.comments += 1;
    else if (item.startsWith('@@')) result.exceptions += 1;
    else if (item.startsWith('/') && item.endsWith('/')) result.regex += 1;
    else result.rules += 1;
  }
  return result;
}

function pacShape(value) {
  if (typeof value !== 'string') return '<non-string>';
  return {
    lines: value.split(/\\r?\\n/u).length,
    findProxyForUrl: /\\bFindProxyForURL\\b/u.test(value),
    direct: (value.match(/\\bDIRECT\\b/gu) ?? []).length,
    proxy: (value.match(/\\b(?:PROXY|HTTPS|SOCKS5?|SOCKS)\\b/gu) ?? []).length,
  };
}
"""
new = """function ruleListShape(value) {
  if (typeof value !== 'string') return '<non-string>';
  return value.split(/\\r?\\n/u).map((line) => {
    const item = line.trim();
    let kind = 'rule';
    if (!item) kind = 'blank';
    else if (item.startsWith('!')) kind = 'comment';
    else if (item.startsWith('[')) kind = 'header';
    else if (item.startsWith('@@')) kind = 'exception';
    else if (item.startsWith('/') && item.endsWith('/')) kind = 'regex';
    return { kind, syntax: patternShape(item) };
  });
}

function pacShape(value) {
  if (typeof value !== 'string') return '<non-string>';
  const lines = value.split(/\\r?\\n/u);
  return {
    lines: lines.map((line) => patternShape(line)),
    findProxyForUrl: /\\bFindProxyForURL\\b/u.test(value),
    direct: (value.match(/\\bDIRECT\\b/gu) ?? []).length,
    proxy: (value.match(/\\b(?:PROXY|HTTPS|SOCKS5?|SOCKS)\\b/gu) ?? []).length,
  };
}
"""
if old not in source:
    raise SystemExit('rule/PAC shape block not found')
source = source.replace(old, new, 1)

old = """  for (const match of value.matchAll(/\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b/gu)) tokens.add(match[0]);
  for (const match of value.matchAll(
"""
new = """  for (const match of value.matchAll(/\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b/gu)) tokens.add(match[0]);
  for (const match of value.matchAll(
    /(?:^|[^A-Fa-f0-9:])((?:[A-Fa-f0-9]{0,4}:){2,}[A-Fa-f0-9]{0,4})(?=$|[^A-Fa-f0-9:])/gu,
  )) {
    if (match[1]) tokens.add(match[1]);
  }
  for (const match of value.matchAll(
"""
if old not in source:
    raise SystemExit('network token insertion point not found')
source = source.replace(old, new, 1)

old = """    if (NETWORK_KEY.test(key)) {
      let host = value;
      try {
        if (/^[a-z][a-z0-9+.-]*:\\/\\//iu.test(value)) host = new URL(value).hostname;
      } catch {
        problems.add('invalid network URL');
        return;
      }
      if (host && !safeHost(host)) problems.add('usable network endpoint');
    }
"""
new = """    if (NETWORK_KEY.test(key)) {
      let host = value;
      try {
        if (/^[a-z][a-z0-9+.-]*:\\/\\//iu.test(value)) {
          const parsed = new URL(value);
          host = parsed.hostname;
          if (parsed.username || parsed.password) problems.add('unredacted URL credentials');
          if (parsed.search || parsed.hash) problems.add('unredacted URL query or fragment');
          if (
            parsed.pathname !== '/' &&
            !/^\\/(?:redacted)(?:\\/redacted)*\\/?$/u.test(parsed.pathname)
          ) {
            problems.add('unredacted URL path');
          }
        }
      } catch {
        problems.add('invalid network URL');
        return;
      }
      if (host && !safeHost(host)) problems.add('usable network endpoint');
    }
"""
if old not in source:
    raise SystemExit('network URL block not found')
source = source.replace(old, new, 1)
script.write_text(source)

doc = Path('docs/MIG_01_CORPUS_B_INTAKE.md')
source = doc.read_text()
old = '- condition, Rule List or PAC text contains non-reserved domain/IP identifiers.\n'
new = '- condition, Rule List or PAC text contains non-reserved domain/IP identifiers;\n- URL-bearing fields retain credentials, query/fragment data, or a path other than `/redacted`.\n'
if old not in source:
    raise SystemExit('intake safety doc marker not found')
source = source.replace(old, new, 1)
old = '- PAC line/token shape;\n- Rule List line/category shape;\n'
new = '- ordered PAC line syntax shape after masking identifiers and literal values;\n- ordered Rule List line/category syntax shape after masking identifiers and literal values;\n'
if old not in source:
    raise SystemExit('intake shape doc marker not found')
source = source.replace(old, new, 1)
doc.write_text(source)
