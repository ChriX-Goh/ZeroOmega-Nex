from pathlib import Path

runtime = Path('.github/patches/apply-popup-temporary-rules-runtime.py')
text = runtime.read_text()
old = '''
# Prevent an unused import regression by making the runtime check semantic rather than prefix-only.
replace_once(
    'apps/extension/src/lib/profile-workflow-activation.ts',
    """          route.kind === 'profile' && route.profileId.startsWith('__zeroomega_nex_popup_temporary__/')
""",
    """          route.kind === 'profile' &&
          isPopupTemporarySnapshotId(
            popupTemporarySnapshotId(route.profileId, 'probe'),
          ) &&
          route.profileId.startsWith('__zeroomega_nex_popup_temporary__/')
""",
)
'''
if text.count(old) != 1:
    raise SystemExit(f'temporary runtime tail match count: {text.count(old)}')
runtime.write_text(text.replace(old, '\n'))

coordinator = Path('.github/patches/apply-popup-temporary-rules-coordinator.py')
text = coordinator.read_text()
old = """} from '@zeroomega-nex/browser-adapters';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
"""
new = """} from '@zeroomega-nex/browser-adapters';
import { browser } from 'wxt/browser';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary coordinator browser import match count: {text.count(old)}')
coordinator.write_text(text.replace(old, new))
