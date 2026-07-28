from pathlib import Path

path = Path('scripts/validate-ui-compatibility.mjs')
lines = path.read_text().splitlines()

if not any('proxyAuthenticationPermissionClientPath' in line for line in lines):
    inserted = False
    for index, line in enumerate(lines):
        if 'proxyAuthenticationPlanPath' in line and line.lstrip().startswith('const '):
            lines[index + 1:index + 1] = [
                'const proxyAuthenticationPermissionClientPath =',
                "  'apps/extension/src/lib/proxy-auth-permission-client.ts';",
            ]
            inserted = True
            break
    if not inserted:
        raise SystemExit('proxy authentication plan path constant anchor missing')

if not any(line.strip() == 'proxyAuthenticationPermissionClient,' for line in lines):
    inserted = False
    for index, line in enumerate(lines):
        if line.strip() == 'proxyAuthenticationPlan,':
            lines.insert(index + 1, '  proxyAuthenticationPermissionClient,')
            inserted = True
            break
    if not inserted:
        raise SystemExit('proxy authentication permission validator destructuring anchor missing')

read_line = "  readFile(proxyAuthenticationPermissionClientPath, 'utf8'),"
if read_line not in lines:
    inserted = False
    for index, line in enumerate(lines):
        if line.strip() == "readFile(proxyAuthenticationPlanPath, 'utf8'),":
            lines.insert(index + 1, read_line)
            inserted = True
            break
    if not inserted:
        raise SystemExit('proxy authentication permission validator read anchor missing')

path.write_text('\n'.join(lines) + '\n')
