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
text = text.replace(old, new)

for unused in (
    '  createPopupTemporaryRuleState,\n',
    '  SnapshotActivationState,\n',
):
    if unused not in text:
        raise SystemExit(f'temporary unused import is missing: {unused!r}')
    text = text.replace(unused, '')

test_import = """import {
  popupTemporaryProfileIdForBaseRoute,
  popupTemporarySnapshotId,
  togglePopupTemporaryRule,
  type ProfileWorkflowActivationDriver,
"""
test_import_replacement = """import {
  popupTemporaryProfileIdForBaseRoute,
  popupTemporarySnapshotId,
  type ProfileWorkflowActivationDriver,
"""
if text.count(test_import) != 1:
    raise SystemExit(f'temporary test import match count: {text.count(test_import)}')
text = text.replace(test_import, test_import_replacement)

client_signature = """export async function sendPopupTemporaryRuleCommand(
  command: Omit<PopupTemporaryRuleCommand, 'channel'>,
): Promise<PopupTemporaryRuleCommandResponse> {
"""
client_signature_replacement = """type PopupTemporaryRuleCommandWithoutChannel<T> = T extends {
  readonly channel: unknown;
}
  ? Omit<T, 'channel'>
  : never;

export type PopupTemporaryRuleCommandInput =
  PopupTemporaryRuleCommandWithoutChannel<PopupTemporaryRuleCommand>;

export async function sendPopupTemporaryRuleCommand(
  command: PopupTemporaryRuleCommandInput,
): Promise<PopupTemporaryRuleCommandResponse> {
"""
if text.count(client_signature) != 1:
    raise SystemExit(f'temporary command signature match count: {text.count(client_signature)}')
coordinator.write_text(text.replace(client_signature, client_signature_replacement))
