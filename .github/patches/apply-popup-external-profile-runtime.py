from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new))


replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    """import {
  BrowserStorageProxyAuthenticationRepository,
  listPacSnapshotHistory,
""",
    """import {
  BrowserStorageProxyAuthenticationRepository,
  listPacSnapshotHistory,
  parseExternalProfileCandidate,
""",
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    """  type ProfileWorkflowHistoryService,
  type ProfileWorkflowImportService,
""",
    """  type ProfileWorkflowExternalProfileService,
  type ProfileWorkflowHistoryService,
  type ProfileWorkflowImportService,
""",
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    """class RuntimeInitializer implements ProfileWorkflowInitializer {
""",
    """class BrowserExternalProfileService implements ProfileWorkflowExternalProfileService {
  readonly createId = (kind: Parameters<ProfileWorkflowExternalProfileService['createId']>[0]): string =>
    `external-${kind}-${crypto.randomUUID()}`;

  async readCandidate() {
    const runtime = currentBrowserProxyRuntime();
    try {
      return parseExternalProfileCandidate(await runtime.driver.readState());
    } finally {
      runtime.dispose();
    }
  }
}

class RuntimeInitializer implements ProfileWorkflowInitializer {
""",
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    """  const historyService = createHistoryService(repository);
  const ruleSourceUpdateService = createRuleSourceUpdateService(
""",
    """  const historyService = createHistoryService(repository);
  const externalProfileService = new BrowserExternalProfileService();
  const ruleSourceUpdateService = createRuleSourceUpdateService(
""",
)
replace_once(
    'apps/extension/src/lib/profile-workflow-runtime.ts',
    """      rollbackService,
      ruleSourceUpdateService,
    );
""",
    """      rollbackService,
      ruleSourceUpdateService,
      externalProfileService,
    );
""",
)

# Extend the ownership client with a safe preview only; raw proxy values remain background-only.
path = Path('apps/extension/src/lib/proxy-ownership-client.ts')
text = path.read_text()
text = text.replace(
    "import type { ProxyOwnershipView } from '@zeroomega-nex/browser-adapters';",
    "import type { ProxyOwnershipView as BrowserProxyOwnershipView } from '@zeroomega-nex/browser-adapters';",
)
text = text.replace(
    """export type {
  ProxyOwnershipBlockReason,
  ProxyOwnershipView,
} from '@zeroomega-nex/browser-adapters';
""",
    """export type { ProxyOwnershipBlockReason } from '@zeroomega-nex/browser-adapters';

export interface ExternalProfilePreview {
  readonly kind: 'fixed' | 'pac';
  readonly suggestedName: string;
}

export interface ProxyOwnershipView extends BrowserProxyOwnershipView {
  readonly externalProfile?: ExternalProfilePreview;
}
""",
)
old = """    typeof view.blocked === 'boolean' &&
    typeof view.controlLevel === 'string'
  );
"""
new = """    typeof view.blocked === 'boolean' &&
    typeof view.controlLevel === 'string' &&
    (view.externalProfile === undefined ||
      (view.externalProfile !== null &&
        typeof view.externalProfile === 'object' &&
        ((view.externalProfile as Record<string, unknown>).kind === 'fixed' ||
          (view.externalProfile as Record<string, unknown>).kind === 'pac') &&
        typeof (view.externalProfile as Record<string, unknown>).suggestedName === 'string'))
  );
"""
if text.count(old) != 1:
    raise SystemExit(f'ownership response validation match count: {text.count(old)}')
path.write_text(text.replace(old, new))

# Ownership runtime reads workflow and activation state, but returns only a safe type/name preview.
path = Path('apps/extension/src/lib/proxy-ownership-runtime.ts')
text = path.read_text()
old = """import { inspectProxyOwnership, type ProxyOwnershipView } from '@zeroomega-nex/browser-adapters';
import { browser } from 'wxt/browser';
"""
new = """import {
  inspectProxyOwnership,
  parseExternalProfileCandidate,
  type BrowserStorageArea,
} from '@zeroomega-nex/browser-adapters';
import {
  BrowserStorageProfileWorkflowRepository,
  findMatchingExternalProfile,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';
import { browser } from 'wxt/browser';
"""
if text.count(old) != 1:
    raise SystemExit(f'ownership runtime import match count: {text.count(old)}')
text = text.replace(old, new)
text = text.replace(
    """  isProxyOwnershipCommand,
  type ProxyOwnershipCommandResponse,
""",
    """  isProxyOwnershipCommand,
  type ProxyOwnershipCommandResponse,
  type ProxyOwnershipView,
""",
)
old = """export interface ProxyOwnershipRuntimeApi {
  readonly runtime: { readonly onMessage: ProxyOwnershipMessageEvent };
}
"""
new = """export interface ProxyOwnershipRuntimeApi {
  readonly runtime: { readonly onMessage: ProxyOwnershipMessageEvent };
  readonly storage: {
    readonly local: ProfileWorkflowStorageArea & BrowserStorageArea;
  };
}
"""
if text.count(old) != 1:
    raise SystemExit(f'ownership runtime api match count: {text.count(old)}')
text = text.replace(old, new)
old = """async function inspectCurrentOwnership(): Promise<ProxyOwnershipView> {
  const runtime = currentBrowserProxyRuntime();
  try {
    return await inspectProxyOwnership(runtime.driver);
  } finally {
    runtime.dispose();
  }
}
"""
new = """async function inspectCurrentOwnership(
  api: ProxyOwnershipRuntimeApi,
): Promise<ProxyOwnershipView> {
  const runtime = currentBrowserProxyRuntime();
  try {
    const ownership = await inspectProxyOwnership(runtime.driver);
    if (ownership.blocked) return ownership;
    const activation = await runtime.repository.getState();
    if (activation.activeBuiltInMode !== 'system') return ownership;
    const workflow = await new BrowserStorageProfileWorkflowRepository(api.storage.local).read();
    if (!workflow?.applied.settings.interface.showExternalProfile) return ownership;
    const candidate = parseExternalProfileCandidate(await runtime.driver.readState());
    if (!candidate || findMatchingExternalProfile(workflow.applied, candidate)) return ownership;
    return {
      ...ownership,
      externalProfile: {
        kind: candidate.kind,
        suggestedName: 'External Profile',
      },
    };
  } finally {
    runtime.dispose();
  }
}
"""
if text.count(old) != 1:
    raise SystemExit(f'ownership inspection match count: {text.count(old)}')
text = text.replace(old, new)
text = text.replace('return inspectCurrentOwnership().then(', 'return inspectCurrentOwnership(api).then(')
path.write_text(text)
