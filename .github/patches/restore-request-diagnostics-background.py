from pathlib import Path

path = Path('apps/extension/src/entrypoints/background.ts')
text = path.read_text()
old = """  proxyOwnershipRuntime = registerProxyOwnershipRuntime(currentProxyOwnershipRuntimeApi());
  requestDiagnosticsRuntime = registerRequestDiagnosticsRuntime(
    currentRequestDiagnosticsRuntimeApi(),
  );

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch(
"""
new = """  proxyOwnershipRuntime = registerProxyOwnershipRuntime(currentProxyOwnershipRuntimeApi());
  requestDiagnosticsRuntime = registerRequestDiagnosticsRuntime(
    currentRequestDiagnosticsRuntimeApi(),
  );
  inspectRuntime = registerInspectRuntime(currentInspectRuntimeApi());

  void restoreProxyRuntime(authenticationManager, temporaryRuleCoordinator).catch(
"""
if text.count(old) != 1:
    raise SystemExit('background compatibility restoration did not find the diagnostics registration block')
path.write_text(text.replace(old, new, 1))
