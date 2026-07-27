from pathlib import Path

path = Path('.github/patches/apply-popup-proxy-ownership-runtime.py')
text = path.read_text()
old = '''  popupTemporaryRuleRuntime = temporaryRuleCoordinator
    ? registerPopupTemporaryRuleRuntime(temporaryRuleApi, temporaryRuleCoordinator)
    : undefined;

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch((error: unknown) => {
'''
new = '''  popupTemporaryRuleRuntime = temporaryRuleCoordinator
    ? registerPopupTemporaryRuleRuntime(temporaryRuleApi, temporaryRuleCoordinator)
    : undefined;

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch(
    (error: unknown) => {
'''
replacement_old = '''  popupTemporaryRuleRuntime = temporaryRuleCoordinator
    ? registerPopupTemporaryRuleRuntime(temporaryRuleApi, temporaryRuleCoordinator)
    : undefined;
  proxyOwnershipRuntime = registerProxyOwnershipRuntime(currentProxyOwnershipRuntimeApi());

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch((error: unknown) => {
'''
replacement_new = '''  popupTemporaryRuleRuntime = temporaryRuleCoordinator
    ? registerPopupTemporaryRuleRuntime(temporaryRuleApi, temporaryRuleCoordinator)
    : undefined;
  proxyOwnershipRuntime = registerProxyOwnershipRuntime(currentProxyOwnershipRuntimeApi());

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch(
    (error: unknown) => {
'''
if text.count(old) != 1 or text.count(replacement_old) != 1:
    raise SystemExit(
        f'proxy ownership runtime stage counts: old={text.count(old)}, new={text.count(replacement_old)}'
    )
path.write_text(text.replace(old, new).replace(replacement_old, replacement_new))
