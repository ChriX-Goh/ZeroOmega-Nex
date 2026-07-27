from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if text.count(old) != 1:
        raise SystemExit(f'{path}: expected one match for {old[:100]!r}')
    target.write_text(text.replace(old, new, 1))

client = Path('apps/extension/src/lib/request-diagnostics-client.ts')
text = client.read_text()
text = text.replace(
    "export const REQUEST_DIAGNOSTICS_PERMISSION = {\n  permissions: ['webRequest'],\n  origins: ['http://*/*', 'https://*/*'],\n};",
    "export const REQUEST_DIAGNOSTICS_PERMISSION = {\n  permissions: ['webRequest'],\n  origins: ['http://*/*', 'https://*/*'],\n};\n\ninterface RequestDiagnosticsClientApi {\n  readonly runtime: { sendMessage(message: RequestDiagnosticsCommand): Promise<unknown> };\n  readonly permissions: {\n    contains(permission: { permissions: string[]; origins: string[] }): Promise<boolean>;\n    request(permission: { permissions: string[]; origins: string[] }): Promise<boolean>;\n  };\n}",
)
text = text.replace(
    "export async function sendRequestDiagnosticsCommand(\n  command: Omit<RequestDiagnosticsCommand, 'channel'>,\n): Promise<RequestDiagnosticsCommandResponse> {\n  const response = await browser.runtime.sendMessage({",
    "export async function sendRequestDiagnosticsCommand(\n  command: Omit<RequestDiagnosticsCommand, 'channel'>,\n  api: RequestDiagnosticsClientApi = browser as unknown as RequestDiagnosticsClientApi,\n): Promise<RequestDiagnosticsCommandResponse> {\n  const response = await api.runtime.sendMessage({",
)
text = text.replace(
    "export async function hasRequestDiagnosticsPermission(): Promise<boolean> {\n  return browser.permissions.contains(REQUEST_DIAGNOSTICS_PERMISSION);\n}\n\nexport async function requestRequestDiagnosticsPermission(): Promise<boolean> {\n  return browser.permissions.request(REQUEST_DIAGNOSTICS_PERMISSION);\n}",
    "export async function hasRequestDiagnosticsPermission(\n  api: RequestDiagnosticsClientApi = browser as unknown as RequestDiagnosticsClientApi,\n): Promise<boolean> {\n  return api.permissions.contains(REQUEST_DIAGNOSTICS_PERMISSION);\n}\n\nexport async function requestRequestDiagnosticsPermission(\n  api: RequestDiagnosticsClientApi = browser as unknown as RequestDiagnosticsClientApi,\n): Promise<boolean> {\n  return api.permissions.request(REQUEST_DIAGNOSTICS_PERMISSION);\n}",
)
client.write_text(text)

replace_once(
    'apps/extension/src/entrypoints/popup/App.svelte',
    "url: browser.runtime.getURL(`/network.html?tabId=${currentSite.tabId}`),",
    "url: new URL(`/network.html?tabId=${currentSite.tabId}`, location.href).href,",
)

runtime = Path('apps/extension/src/lib/request-diagnostics-runtime.ts')
text = runtime.read_text().replace('current.timeoutHandle = undefined;', 'delete current.timeoutHandle;')
text = text.replace('request.timeoutHandle = undefined;', 'delete request.timeoutHandle;')
runtime.write_text(text)

replace_once(
    'apps/extension/src/entrypoints/network/App.svelte',
    "const response = await sendRequestDiagnosticsCommand({ action, tabId });",
    "const response = await sendRequestDiagnosticsCommand({\n      action,\n      ...(tabId === undefined ? {} : { tabId }),\n    });",
)

replace_once(
    'apps/extension/src/lib/request-diagnostics-model.test.ts',
    "{ ...record(2, 1, 200), status: 'timeout', error: undefined },",
    "{ ...record(2, 1, 200), status: 'timeout', error: 'ERR_TIMEOUT' },",
)
