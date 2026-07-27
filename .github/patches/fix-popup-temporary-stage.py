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
text = text.replace(old, '\n')
old = """import { popupTemporaryProfileIdForBaseRoute, popupTemporarySnapshotId } from '@zeroomega-nex/profile-workflow';
"""
new = """import { popupTemporarySnapshotId } from '@zeroomega-nex/profile-workflow';
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary session test import match count: {text.count(old)}')
text = text.replace(old, new)
old = """    const id = popupTemporarySnapshotId(
      popupTemporaryProfileIdForBaseRoute({ kind: 'direct' }),
      'test',
    );
"""
new = """    const id = popupTemporarySnapshotId({ kind: 'direct' }, 'test');
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary session test ID match count: {text.count(old)}')
text = text.replace(old, new)
old = """        const temporarySnapshotId =
          route.kind === 'profile' && route.profileId.startsWith(POPUP_TEMPORARY_PROFILE_ID_PREFIX)
            ? popupTemporarySnapshotId(route.profileId, this.#temporarySnapshotNonce())
            : undefined;
"""
new = """        const temporaryProfile =
          route.kind === 'profile' && route.profileId === POPUP_TEMPORARY_PROFILE_ID_PREFIX
            ? spec.profiles.find((profile) => profile.id === route.profileId)
            : undefined;
        const temporarySnapshotId =
          temporaryProfile?.kind === 'switch'
            ? popupTemporarySnapshotId(
                temporaryProfile.defaultRoute,
                this.#temporarySnapshotNonce(),
              )
            : undefined;
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary activation snapshot match count: {text.count(old)}')
runtime.write_text(text.replace(old, new))

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
    '  decodePopupTemporaryProfileId,\n',
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
text = text.replace(client_signature, client_signature_replacement)

old = """function baseRouteFromRuntime(runtime: ProfileWorkflowRuntimeView): ProfileRouteTarget | undefined {
  if (runtime.activeRoute?.kind === 'profile') {
    return decodePopupTemporaryProfileId(runtime.activeRoute.profileId) ?? runtime.activeRoute;
  }
  if (runtime.activeRoute) return runtime.activeRoute;
  return runtime.activeSnapshotId
    ? decodePopupTemporarySnapshotId(runtime.activeSnapshotId)
    : undefined;
}
"""
new = """function baseRouteFromRuntime(runtime: ProfileWorkflowRuntimeView): ProfileRouteTarget | undefined {
  const temporaryBase = runtime.activeSnapshotId
    ? decodePopupTemporarySnapshotId(runtime.activeSnapshotId)
    : undefined;
  return temporaryBase ?? runtime.activeRoute;
}
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary base route match count: {text.count(old)}')
text = text.replace(old, new)

old = """    const decodedRequested =
      requestedRoute?.kind === 'profile'
        ? decodePopupTemporaryProfileId(requestedRoute.profileId)
        : undefined;
    const baseRoute =
      decodedRequested ?? requestedRoute ?? candidate.settings.startup.route ?? { kind: 'direct' };
"""
new = """    const baseRoute = requestedRoute ?? candidate.settings.startup.route ?? { kind: 'direct' };
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary requested route match count: {text.count(old)}')
text = text.replace(old, new)

old = """        if (snapshot?.startRoute.kind === 'profile') {
          baseRoute =
            decodePopupTemporaryProfileId(snapshot.startRoute.profileId) ?? snapshot.startRoute;
        } else {
          baseRoute = snapshot?.startRoute;
        }
"""
new = """        baseRoute = snapshot?.startRoute;
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary startup route match count: {text.count(old)}')
text = text.replace(old, new)

old = """    this.runtime = { activeSnapshotId: route?.kind === 'profile' && route.profileId.startsWith('__zeroomega') ? popupTemporarySnapshotId(route.profileId, 'runtime') : 'normal', ...(route === undefined ? {} : { activeRoute: structuredClone(route) }) };
"""
new = """    const temporaryProfile =
      route?.kind === 'profile'
        ? spec.profiles.find((profile) => profile.id === route.profileId)
        : undefined;
    this.runtime = {
      activeSnapshotId:
        temporaryProfile?.kind === 'switch'
          ? popupTemporarySnapshotId(temporaryProfile.defaultRoute, 'runtime')
          : 'normal',
      ...(route === undefined ? {} : { activeRoute: structuredClone(route) }),
    };
"""
if text.count(old) != 1:
    raise SystemExit(f'temporary test driver match count: {text.count(old)}')
coordinator.write_text(text.replace(old, new))
