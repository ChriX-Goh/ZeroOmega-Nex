from pathlib import Path

path = Path('.github/patches/apply-popup-external-profile-command.py')
text = path.read_text()
old = """import type { ProfileWorkflowActivationDriver } from './contracts.js';
"""
new = """import type { ProfileRouteTarget } from '@zeroomega-nex/profile-spec';

import type { ProfileWorkflowActivationDriver } from './contracts.js';
"""
if text.count(old) != 1:
    raise SystemExit(f'external command test route import count: {text.count(old)}')
text = text.replace(old, new)
old = """function driver(activeRoute = { kind: 'system' } as const): ProfileWorkflowActivationDriver & {
"""
new = """function driver(
  activeRoute: ProfileRouteTarget = { kind: 'system' },
): ProfileWorkflowActivationDriver & {
"""
if text.count(old) != 1:
    raise SystemExit(f'external command test driver signature count: {text.count(old)}')
path.write_text(text.replace(old, new))
