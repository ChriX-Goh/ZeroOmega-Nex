from pathlib import Path
import json
import os


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    target.write_text(text.replace(old, new, 1))


runtime_path = Path('apps/extension/src/lib/inspect-runtime.ts')
text = runtime_path.read_text()
text = text.replace(
    """import {
  BrowserStorageProfileWorkflowRepository,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';
import { browser } from 'wxt/browser';
""",
    """import type { ProfileRouteTarget, ProfileSpec } from '@zeroomega-nex/profile-spec';
import {
  BrowserStorageProfileWorkflowRepository,
  type ProfileWorkflowStorageArea,
} from '@zeroomega-nex/profile-workflow';
import { evaluateProfileGraph, type GraphDecision } from '@zeroomega-nex/reference-interpreter';
import { browser } from 'wxt/browser';

import { currentBrowserProxyRuntime } from './browser-proxy-runtime';
""",
)
text = text.replace(
    """  readonly i18n?: { getMessage(name: string): string };""",
    """  readonly i18n?: {
    getMessage(name: string, substitutions?: string | readonly string[]): string;
  };""",
)
text = text.replace(
    """export interface InspectRuntimeOptions {
  readonly readEnabled?: () => Promise<boolean>;
  readonly now?: () => number;
}""",
    """export interface InspectRoutePresentation {
  readonly kind: 'direct' | 'system' | 'profile';
  readonly name: string;
}

export interface InspectResultPresentation {
  readonly current: InspectRoutePresentation;
  readonly result: InspectRoutePresentation;
  readonly color: string;
}

export interface InspectRuntimeOptions {
  readonly readEnabled?: () => Promise<boolean>;
  readonly readActiveRoute?: () => Promise<ProfileRouteTarget | undefined>;
  readonly evaluatePresentation?: (
    url: string,
    tabUrl: string | undefined,
  ) => Promise<InspectResultPresentation | undefined>;
  readonly now?: () => number;
}""",
)
insert_anchor = """function urlForMenu(info: InspectContextMenuInfo): string | undefined {"""
helpers = r"""function builtInColor(spec: ProfileSpec, kind: 'direct' | 'system'): string {
  return (
    spec.settings.interface.builtInProfiles?.[kind]?.color ??
    (kind === 'direct' ? '#bdbdbd' : '#616161')
  );
}

function routePresentation(
  spec: ProfileSpec,
  route: ProfileRouteTarget,
): InspectRoutePresentation & { readonly color: string } {
  if (route.kind === 'direct') {
    return { kind: 'direct', name: 'Direct', color: builtInColor(spec, 'direct') };
  }
  if (route.kind === 'system') {
    return { kind: 'system', name: 'System Proxy', color: builtInColor(spec, 'system') };
  }
  const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
  return {
    kind: 'profile',
    name: profile?.name ?? route.profileId,
    color: profile?.color ?? '#90a4ae',
  };
}

function currentRoutePresentation(
  spec: ProfileSpec,
  route: ProfileRouteTarget,
): InspectRoutePresentation & { readonly color: string } {
  const current = routePresentation(spec, route);
  if (route.kind !== 'profile') return current;
  const profile = spec.profiles.find((candidate) => candidate.id === route.profileId);
  if (profile?.kind !== 'virtual') return current;
  const target = routePresentation(spec, profile.targetRoute);
  return { ...current, name: `${current.name} [${target.name}]`, color: target.color };
}

function lastEnteredProfilePresentation(
  spec: ProfileSpec,
  decision: GraphDecision,
): (InspectRoutePresentation & { readonly color: string }) | undefined {
  for (let index = decision.trace.length - 1; index >= 0; index -= 1) {
    const entry = decision.trace[index];
    if (entry?.action !== 'enter-profile' || !entry.profileId) continue;
    return routePresentation(spec, { kind: 'profile', profileId: entry.profileId });
  }
  return undefined;
}

export function evaluateInspectResultPresentation(
  spec: ProfileSpec,
  startRoute: ProfileRouteTarget,
  urlValue: string,
  now = Date.now(),
): InspectResultPresentation {
  const url = new URL(urlValue);
  const local = new Date(now);
  const request = {
    url: url.href,
    host: url.hostname,
    scheme: url.protocol.slice(0, -1),
    ...(url.port ? { port: Number(url.port) } : {}),
    localWeekday: local.getDay(),
    localHour: local.getHours(),
  };
  const decision = evaluateProfileGraph(spec, startRoute, request);
  const current = currentRoutePresentation(spec, startRoute);
  let result: InspectRoutePresentation & { readonly color: string } =
    lastEnteredProfilePresentation(spec, decision) ?? current;
  if (decision.status === 'resolved') {
    if (decision.route.kind === 'direct') result = routePresentation(spec, { kind: 'direct' });
    else if (decision.route.kind === 'system')
      result = routePresentation(spec, { kind: 'system' });
  }
  return {
    current: { kind: current.kind, name: current.name },
    result: { kind: result.kind, name: result.name },
    color: result.color,
  };
}

async function readActiveRouteFromBrowser(): Promise<ProfileRouteTarget | undefined> {
  const runtime = currentBrowserProxyRuntime();
  try {
    const state = await runtime.repository.getState();
    if (state.activeBuiltInMode) return { kind: state.activeBuiltInMode };
    if (!state.activeSnapshotId) return undefined;
    return (await runtime.repository.getSnapshot(state.activeSnapshotId))?.startRoute;
  } finally {
    runtime.dispose();
  }
}

function localizedRouteName(api: InspectRuntimeApi, route: InspectRoutePresentation): string {
  const key = route.kind === 'direct' ? 'routeDirect' : route.kind === 'system' ? 'routeSystem' : '';
  if (!key) return route.name;
  const localized = api.i18n?.getMessage(key);
  return localized && localized !== key ? localized : route.name;
}

function routeSummary(api: InspectRuntimeApi, presentation: InspectResultPresentation): string {
  const current = localizedRouteName(api, presentation.current);
  const result = localizedRouteName(api, presentation.result);
  const extensionName = api.i18n?.getMessage('extensionName') || 'ZeroOmega Nex';
  return `${extensionName} — ${current === result ? current : `${current} → ${result}`}`;
}

"""
if text.count(insert_anchor) != 1:
    raise SystemExit('inspect runtime helper insertion anchor missing')
text = text.replace(insert_anchor, helpers + insert_anchor, 1)
old_title = r"""function inspectTitle(url: string, tabUrl: string | undefined): string {
  const target = new URL(url);
  let display = target.hostname;
  try {
    const page = tabUrl ? new URL(tabUrl) : undefined;
    if (page?.hostname === target.hostname) display = `${target.pathname}${target.search}` || '/';
  } catch {
    // The target itself was already validated. A malformed tab URL only affects display shortening.
  }
  return `Inspect ${display}`;
}"""
new_title = r"""function inspectTitle(
  api: InspectRuntimeApi,
  url: string,
  tabUrl: string | undefined,
  presentation: InspectResultPresentation | undefined,
): string {
  const target = new URL(url);
  let display = target.hostname;
  try {
    const page = tabUrl ? new URL(tabUrl) : undefined;
    if (page?.hostname === target.hostname) display = `${target.pathname}${target.search}` || '/';
  } catch {
    // The target itself was already validated. A malformed tab URL only affects display shortening.
  }
  const key = 'browserActionTitleInspect';
  const localized = api.i18n?.getMessage(key, display);
  const heading = localized && localized !== key ? localized : `[Inspect] ${display}`;
  return presentation ? `${heading}\n${routeSummary(api, presentation)}` : heading;
}"""
if text.count(old_title) != 1:
    raise SystemExit('inspect title function missing')
text = text.replace(old_title, new_title, 1)
old_store = r"""async function storeEntry(
  api: InspectRuntimeApi,
  tabId: number,
  url: string,
  tabUrl: string | undefined,
  now: () => number,
): Promise<void> {
  const state = await readState(api.storage.session);
  const inspectedAt = new Date(now()).toISOString();
  await writeEntries(api.storage.session, {
    ...state.entries,
    [String(tabId)]: { url, inspectedAt },
  });
  await Promise.all([
    Promise.resolve(api.action.setBadgeText({ tabId, text: '#' })),
    Promise.resolve(api.action.setBadgeBackgroundColor({ tabId, color: '#607d8b' })),
    Promise.resolve(api.action.setTitle({ tabId, title: inspectTitle(url, tabUrl) })),
  ]);
}"""
new_store = r"""async function storeEntry(
  api: InspectRuntimeApi,
  tabId: number,
  url: string,
  tabUrl: string | undefined,
  now: () => number,
  presentation: InspectResultPresentation | undefined,
): Promise<void> {
  const state = await readState(api.storage.session);
  const inspectedAt = new Date(now()).toISOString();
  await writeEntries(api.storage.session, {
    ...state.entries,
    [String(tabId)]: { url, inspectedAt },
  });
  await Promise.all([
    Promise.resolve(api.action.setBadgeText({ tabId, text: '#' })),
    Promise.resolve(
      api.action.setBadgeBackgroundColor({ tabId, color: presentation?.color ?? '#607d8b' }),
    ),
    Promise.resolve(api.action.setTitle({ tabId, title: inspectTitle(api, url, tabUrl, presentation) })),
  ]);
}"""
if text.count(old_store) != 1:
    raise SystemExit('inspect storeEntry block missing')
text = text.replace(old_store, new_store, 1)
old_register = r"""  const readEnabled =
    options.readEnabled ??
    (async () => (await repository.read())?.applied.settings.interface.showInspectMenu === true);
  let disposed = false;"""
new_register = r"""  const readEnabled =
    options.readEnabled ??
    (async () => (await repository.read())?.applied.settings.interface.showInspectMenu === true);
  const readActiveRoute = options.readActiveRoute ?? readActiveRouteFromBrowser;
  const evaluatePresentation =
    options.evaluatePresentation ??
    (async (url: string) => {
      const [workflow, activeRoute] = await Promise.all([repository.read(), readActiveRoute()]);
      if (!workflow || !activeRoute) return undefined;
      return evaluateInspectResultPresentation(workflow.applied, activeRoute, url, now());
    });
  let disposed = false;"""
if text.count(old_register) != 1:
    raise SystemExit('inspect register options block missing')
text = text.replace(old_register, new_register, 1)
old_click = r"""  const clickListener = (info: InspectContextMenuInfo, tab: InspectTab): void => {
    if (!enabled || tab.id === undefined) return;
    const url = urlForMenu(info);
    if (!url || !supportedUrl(url)) return;
    void (
      url === tab.url ? removeEntry(api, tab.id) : storeEntry(api, tab.id, url, tab.url, now)
    ).catch((error: unknown) => console.error('Unable to store inspected URL.', error));
  };"""
new_click = r"""  const clickListener = (info: InspectContextMenuInfo, tab: InspectTab): void => {
    if (!enabled || tab.id === undefined) return;
    const url = urlForMenu(info);
    if (!url || !supportedUrl(url)) return;
    void (async () => {
      if (url === tab.url) {
        await removeEntry(api, tab.id!);
        return;
      }
      let presentation: InspectResultPresentation | undefined;
      try {
        presentation = await evaluatePresentation(url, tab.url);
      } catch (error) {
        console.warn('Unable to evaluate inspected URL result route.', error);
      }
      await storeEntry(api, tab.id!, url, tab.url, now, presentation);
    })().catch((error: unknown) => console.error('Unable to store inspected URL.', error));
  };"""
if text.count(old_click) != 1:
    raise SystemExit('inspect click listener block missing')
text = text.replace(old_click, new_click, 1)
runtime_path.write_text(text)

# Add the direct workspace dependency explicitly.
package_path = Path('apps/extension/package.json')
package_data = json.loads(package_path.read_text())
package_data['dependencies']['@zeroomega-nex/reference-interpreter'] = 'workspace:*'
package_path.write_text(json.dumps(package_data, ensure_ascii=False, indent=2) + '\n')

# Extend locale messages with the original Inspect title and built-in route labels.
locale_values = {
    'en': {'inspect': '[Inspect] $URL$', 'direct': 'Direct', 'system': 'System Proxy'},
    'zh_CN': {'inspect': '[检查] $URL$', 'direct': '直接连接', 'system': '系统代理'},
    'zh_TW': {'inspect': '[檢查] $URL$', 'direct': '直接連線', 'system': '系統代理'},
}
for locale, values in locale_values.items():
    path = Path(f'apps/extension/public/_locales/{locale}/messages.json')
    data = json.loads(path.read_text())
    data['browserActionTitleInspect'] = {
        'message': values['inspect'],
        'placeholders': {'url': {'content': '$1'}},
    }
    data['routeDirect'] = {'message': values['direct']}
    data['routeSystem'] = {'message': values['system']}
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

# Expand unit evidence to prove source-backed result color/title selection.
test_path = Path('apps/extension/src/lib/inspect-runtime.test.ts')
test = test_path.read_text()
test = test.replace(
    """import { describe, expect, it } from 'vitest';

import {""",
    """import { createDefaultProfileSpec } from '@zeroomega-nex/profile-workflow';
import { describe, expect, it } from 'vitest';

import {""",
)
test = test.replace(
    """  INSPECT_MENU_IDS,
  registerInspectRuntime,""",
    """  INSPECT_MENU_IDS,
  evaluateInspectResultPresentation,
  registerInspectRuntime,""",
)
test = test.replace(
    """  const badgeCalls: unknown[] = [];
  const titleCalls: unknown[] = [];""",
    """  const badgeCalls: unknown[] = [];
  const badgeColorCalls: unknown[] = [];
  const titleCalls: unknown[] = [];""",
)
test = test.replace(
    """      setBadgeBackgroundColor() {},""",
    """      setBadgeBackgroundColor(details: unknown) {
        badgeColorCalls.push(details);
      },""",
)
test = test.replace(
    """    badgeCalls,
    titleCalls,""",
    """    badgeCalls,
    badgeColorCalls,
    titleCalls,""",
)
test = test.replace(
    """      now: () => now,
    });""",
    """      now: () => now,
      evaluatePresentation: async () => ({
        current: { kind: 'profile', name: 'Work' },
        result: { kind: 'direct', name: 'Direct' },
        color: '#bdbdbd',
      }),
    });""",
    1,
)
test = test.replace(
    """    expect(fake.badgeCalls).toContainEqual({ tabId: 7, text: '#' });
    expect(fake.titleCalls).toContainEqual({ tabId: 7, title: 'Inspect cdn.example.test' });""",
    """    expect(fake.badgeCalls).toContainEqual({ tabId: 7, text: '#' });
    expect(fake.badgeColorCalls).toContainEqual({ tabId: 7, color: '#bdbdbd' });
    expect(fake.titleCalls).toContainEqual({
      tabId: 7,
      title: '[Inspect] cdn.example.test\\nZeroOmega Nex — Work → Direct',
    });""",
)
insert = r"""

  it('evaluates the original result-profile badge color for inspected URLs', () => {
    const spec = createDefaultProfileSpec({
      documentId: 'document-inspect',
      revisionId: 'revision-inspect',
      createdAt: '2026-07-27T18:00:00.000Z',
    });
    expect(
      evaluateInspectResultPresentation(
        spec,
        { kind: 'profile', profileId: 'profile-default-proxy' },
        'https://remote.example.test/file.js',
      ),
    ).toEqual({
      current: { kind: 'profile', name: 'Proxy' },
      result: { kind: 'profile', name: 'Proxy' },
      color: '#64b5f6',
    });
    expect(
      evaluateInspectResultPresentation(
        spec,
        { kind: 'profile', profileId: 'profile-default-proxy' },
        'http://localhost/file.js',
      ),
    ).toEqual({
      current: { kind: 'profile', name: 'Proxy' },
      result: { kind: 'direct', name: 'Direct' },
      color: '#bdbdbd',
    });
  });
"""
marker = "\n  it('clears the inspected target for the page URL and when the tab closes'"
if marker not in test:
    raise SystemExit('inspect test insertion marker missing')
test = test.replace(marker, insert + marker, 1)
test_path.write_text(test)

# Permanent parity guard: fixed inspect color/title regressions must fail verification.
validator_path = Path('scripts/validate-ui-compatibility.mjs')
validator = validator_path.read_text()
anchor = """  [
    popupStyle.includes("font-family: 'Segoe UI'"),"""
check = """  [
    inspectRuntime.includes('evaluateInspectResultPresentation') &&
      inspectRuntime.includes('evaluateProfileGraph') &&
      inspectRuntime.includes('browserActionTitleInspect') &&
      inspectRuntime.includes('presentation?.color') &&
      !inspectRuntime.includes("color: '#607d8b' }"),
    'Inspect must evaluate the active route for the target URL, use the result-profile badge color, and keep the original two-line Inspect title shape.',
  ],
"""
if validator.count(anchor) != 1:
    raise SystemExit('UI validator insertion anchor missing')
validator_path.write_text(validator.replace(anchor, check + anchor, 1))

# Synchronize source-backed knowledge graph and audit/status documents.
kg_path = Path('docs/ORIGINAL_KNOWLEDGE_GRAPH.md')
kg = kg_path.read_text()
kg += """
- 原版 Inspect 点击后调用与普通标签页相同的 `actionForUrl(url)` 路由求值。`#` 徽章颜色不是固定色，而是 `action.resultColor`：通常为最终结果 Profile 颜色；DIRECT 结果使用内置 Direct 颜色。
- 原版 Inspect 标题为两段：`[Inspect]/[检查] <同域 path+query 或异域 hostname>`，换行后接普通 action title。Nex 使用已验证 Applied ProfileSpec、浏览器确认的活动 snapshot/startRoute 和 reference-interpreter 求值；无法精确求值时保留 Inspect 目标但使用中性回退色，不阻断上下文检查。
"""
kg_path.write_text(kg)

replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    "| I-09 | Inspect 菜单       | popup/network      | 可配置显示                     | MUST_MATCH | PARTIAL  | PARTIAL  | Applied flag 驱动 frame/link/media 菜单；HTTP/HTTPS/FTP 目标按 tab session 保存，`#` 徽标提示，Popup 改用该 URL；单测覆盖启停、清除、tab 生命周期                                | 补结果颜色/标题与浏览器右键 E2E  |",
    "| I-09 | Inspect 菜单       | popup/network      | 可配置显示                     | MUST_MATCH | PARTIAL  | PARTIAL  | Applied flag 驱动 frame/link/media 菜单；目标按 tab session 保存；现已按活动 startRoute 求值，`#` 使用结果 Profile/Direct/System 颜色，标题恢复 `[检查] 目标` + 当前→结果两行结构；单测覆盖启停、求值、清除、tab 生命周期 | 补原生浏览器右键菜单 E2E          |",
)
replace_once(
    'docs/UI_AUDIT_MATRIX.md',
    "- **明确 MISSING**：在线恢复、单 Profile 导出、Popup 请求错误/网络检查；Inspect 菜单已恢复核心生命周期但仍缺结果标题与真实右键 E2E；Virtual 已实现但浏览器创建 E2E 仍不完整。",
    "- **明确 MISSING**：在线恢复、单 Profile 导出；请求诊断已恢复有界会话实现；Inspect 已恢复结果颜色与两行标题，但原生浏览器右键菜单 E2E 仍缺；Virtual 已实现但浏览器创建 E2E 仍不完整。",
)
status_path = Path('docs/MILESTONE_8_STATUS.md')
status = status_path.read_text()
integration_run = os.environ.get('INTEGRATION_RUN_ID', 'pending')
status = status.replace(
    "**Current product implementation head:** `e751e21fdb22efc652b3de23860276089319dd29`  ",
    "**Current product implementation head:** Inspect result-presentation product commit containing this document  ",
)
status = status.replace(
    "**Latest integration verification:** run `30293423052` validates the bounded request-diagnostics product commit with full `pnpm verify`, an E2E-host Chromium build, and the complete Chromium regression suite  ",
    f"**Latest integration verification:** run `{integration_run}` validates Inspect result-route badge/title evaluation with full `pnpm verify`, Chromium/Firefox builds, and the complete Chromium regression suite  ",
)
status = status.replace(
    "- Inspect result-route badge color/title evaluation and a real browser context-menu E2E,\n",
    "- a real native browser context-menu interaction E2E for Inspect,\n",
)
status = status.replace(
    "Complete Inspect result-route badge color/title evaluation and a real Chromium context-menu interaction E2E, then continue the remaining profile/export/localization blockers.",
    "Add a real native Chromium context-menu interaction E2E for Inspect, then continue the remaining profile/export/localization blockers.",
)
status = status.replace(
    "- Inspect-menu integration: run `30289377957`, product commit `e305394dae78ce98fa359f5ddc3521ed01675fe9`.\n",
    f"- Inspect-menu integration: run `30289377957`, product commit `e305394dae78ce98fa359f5ddc3521ed01675fe9`.\n- Inspect result-presentation integration: run `{integration_run}`; product commit containing this document.\n",
)
status_path.write_text(status)
