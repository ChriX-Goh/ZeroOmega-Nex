from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_section(text: str, start: str, end: str, replacement: str, label: str) -> str:
    if text.count(start) != 1:
        raise SystemExit(f"{label}: start marker count={text.count(start)}")
    start_index = text.index(start)
    end_index = text.index(end, start_index)
    return text[:start_index] + replacement.rstrip() + "\n\n" + text[end_index:]


order_path = Path("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md")
order = order_path.read_text(encoding="utf-8")

order = replace_once(
    order,
    "The current Nex branch has source-derived pure models for original Ω geometry, icon color decisions, result Badge behavior and per-tab presentation composition. It now also has an isolated browser Action adapter and an exact original-compatible OffscreenCanvas renderer. These slices are tested but not connected to browser runtime state. The per-tab coordinator and complete runtime convergence remain absent.",
    "The current Nex branch now has the source-derived pure models, exact OffscreenCanvas renderer, browser Action adapter, compiled original localization adapter, Action executor, race-safe per-tab coordinator, exact target manifest/static assets, a real browser API construction boundary and a narrow successful-activation notification. A repository-backed resolver is verified for Direct, System and source-certain Fixed-to-proxy results. None of these slices is registered as the sole background Action owner yet; Fixed bypass/Direct and all inclusive-profile traces remain fail-closed until the original `matchProfile.results` display trace is reproduced.",
    "authority summary",
)

trace_section = """### 3.4 Exact `actionForUrl` result-trace contract

The original Chromium target source at tag `v3.5.0` proves that visible details are generated from the full `options.matchProfile(request)` result trace, not merely from the final route:

- a default transition appends localized `(default)` plus `=> <result profile>`;
- an empty Direct result appends the localized Direct-result detail and marks the result as Direct;
- a string trace appends `<source string> => <result>`;
- a condition trace appends `<condition pattern/string> => <result>`;
- temporary rules prepend the localized temporary-rule prefix;
- attached hidden Rule Lists prepend the localized attached-rule prefix;
- if no trace detail exists, the original prints the current profile itself;
- title substitutions remain current name, result name and the complete multiline details string.

Consequences for Nex:

1. final route equality is insufficient to reconstruct the original title;
2. Fixed bypass, Switch, attached Rule List, temporary-rule and Virtual traces must retain display-capable condition/source data;
3. unsupported trace shapes must return unresolved/default state rather than simplified invented wording;
4. current source-certain resolver coverage is limited to Direct, System and Fixed profiles whose evaluated result remains that Fixed profile's proxy endpoint.
"""
if "### 3.4 Exact `actionForUrl` result-trace contract" not in order:
    order = replace_once(order, "## 4. Current Nex graph", trace_section + "\n\n## 4. Current Nex graph", "trace insertion")

current_graph = """## 4. Current Nex graph

```mermaid
graph TD
  M[Target manifest / locale / exact static assets] --> B[Nex background]
  API[Real browser Action / i18n / tabs construction] --> EXEC[Verified Action executor]
  PURE[Pure original toolbar models] --> EXEC
  EXEC --> COORD[Race-safe per-tab coordinator]
  WF[Profile workflow] --> NOTICE[Successful activation notification]
  NOTICE -. not connected .-> COORD
  RES[Repository-backed resolver: Direct / System / Fixed proxy] --> COORD
  B -. coordinator not registered .-> COORD
  TEMP[Temporary rules] -. trace not converged .-> COORD
  OWN[Ownership / external control] -. trace not converged .-> COORD
  INSPECT[Inspect runtime] -. still writes Action directly .-> EXEC
```

Confirmed remaining gaps:

- the verified browser API boundary and coordinator are not registered in `background.ts`;
- activation notification exists but is not connected to `refreshAll({ clearIconCache: true })`;
- Direct and System are source/runtime-backed; a static Fixed profile is resolved only when the final route remains its proxy endpoint;
- Fixed bypass/Direct, Switch, Rule List, Virtual, PAC, temporary-rule and Inspect details still lack a complete original `matchProfile.results` display adapter;
- Inspect remains a competing direct title/Badge writer;
- no Nex real-browser acceptance yet asserts per-tab Action title/icon/Badge transitions.
"""
order = replace_section(order, "## 4. Current Nex graph", "## 5. Original ↔ Nex state matrix", current_graph, "current graph")

adapter_section = """### `TO-04` — browser Action adapter

Status: `PARTIAL`, construction boundary complete but not registered.

Implemented and tested:

- one browser-API boundary for `setIcon`, `setTitle`, `setBadgeText`, `setBadgeBackgroundColor` and `setPopup`;
- every application rewrites all tab-visible fields to clear stale state;
- rejected dynamic ImageData falls back to the supplied original static icon paths;
- exact original default/result/detail localization keys with the original three-substitution title order and fail-closed missing-message behavior;
- one isolated executor that composes pure tab state → original localization → exact renderer → Action presentation;
- real `browser.action`, `browser.i18n`, `browser.tabs` and OffscreenCanvas construction using the exact Badge color, runtime Popup and fallback paths;
- exact compiled locale messages, target-specific manifest hook, static Action assets, permission and shortcut contract.

Remaining:

- register one background owner for the constructed executor;
- invoke it only through the per-tab coordinator;
- remove competing Inspect writes after Inspect becomes a resolver input;
- prove visible target Action mutations in Chromium and Firefox.

No browser API mutation occurs inside the pure state model.
"""
order = replace_section(order, "### `TO-04` — browser Action adapter", "### `TO-05` — per-tab coordinator", adapter_section, "TO-04")

coordinator_section = """### `TO-05` — per-tab coordinator

Status: `PARTIAL`, isolated implementation and resolver slices verified.

Implemented and tested:

- idempotent registration and removal of URL-update and tab-activation listeners;
- per-tab promise queues, refresh sequences and lifecycle invalidation;
- stale async result suppression before Action mutation;
- unresolved-state fallback to the localized default state;
- resolver/Action error reporting with tab and URL context;
- all-tab refresh with optional icon-cache invalidation;
- omission of tabs without an ID;
- repository-backed Direct/System state resolution;
- source-certain static Fixed-to-proxy resolution using the existing reference interpreter;
- explicit fail-closed behavior for Fixed bypass and unsupported profile trace shapes.

Remaining:

- reproduce the original multiline `matchProfile.results` display trace;
- support Fixed bypass, Switch, Rule List, Virtual, PAC and temporary-rule results without simplified wording;
- bind the real coordinator to startup, tab events, successful activation and recovery;
- represent Inspect and external control as coordinator inputs;
- prove tab isolation and stale-state clearing against visible Action state in Chromium and Firefox.
"""
order = replace_section(order, "### `TO-05` — per-tab coordinator", "### `TO-06` — workflow/runtime integration", coordinator_section, "TO-05")

runtime_section = """### `TO-06` — workflow/runtime integration

Status: `PARTIAL`, notification seam implemented but not connected.

Implemented and tested:

- profile-workflow runtime emits a narrow callback only after a successful command returns `appliedSnapshotId`;
- Draft edits, reads and failed commands do not trigger toolbar refresh;
- real browser API construction and state resolver can be composed without registering another Action writer.

Remaining inputs include startup restoration, successful activation refresh, temporary rules, Inspect, ownership/external control, rollback and recovery. Background registration remains intentionally blocked until the result-trace adapter and single-writer transition are safe.
"""
order = replace_section(order, "### `TO-06` — workflow/runtime integration", "### `TO-07` — acceptance automation and real browsers", runtime_section, "TO-06")

checkpoint = """## 8. Verification checkpoint

Exact clean engineering checkpoint Head `e0ec31bd88ce4ff2d40937daee0b63def45fb2e8` passed:

- CI `30615270403`;
- Browser E2E `30615270448`, including Chromium, Firefox and native Inspect;
- Parity Documentation `30615270389`;
- Milestone 8 Visual Evidence `30615270430`.

This checkpoint validates the target manifest/locales/assets, real browser API construction, activation notification seam, exact renderer/executor/coordinator and the conservative Direct/System/Fixed-proxy resolver. It intentionally leaves Fixed bypass and inclusive-profile traces unresolved. It does not close a `TB-*` row because the coordinator is not registered against visible Action state and no repository-owner acceptance exists.
"""
order = replace_section(order, "## 8. Verification checkpoint", "## 9. Current next action", checkpoint, "checkpoint")

next_action = """## 9. Current next action

1. Preserve the original `matchProfile.results` trace data needed for visible details: default transitions, condition strings, attached Rule Lists and temporary-rule prefixes.
2. Build a pure trace-to-title/result adapter and test Fixed bypass before expanding Switch/Rule List/Virtual coverage.
3. Keep PAC and auto-detect target-dependent results unresolved until an exact result source exists.
4. Establish a single Action owner by converting Inspect and external-control state into coordinator inputs.
5. Register startup/tab/activation refresh only after unsupported states can no longer overwrite valid visible state.
6. Add Chromium/Firefox two-tab Action assertions, then request repository-owner review.

Overall status remains `FAILED`, release-blocking, with no candidate permitted.
"""
order = order[: order.index("## 9. Current next action")] + next_action.rstrip() + "\n"
order_path.write_text(order, encoding="utf-8")

kg_path = Path("docs/ORIGINAL_KNOWLEDGE_GRAPH.md")
kg = kg_path.read_text(encoding="utf-8")
checkpoint_marker = "## Session 8 — 工具栏运行时检查点（2026-07-31）"
if checkpoint_marker not in kg:
    kg = kg.rstrip() + "\n\n" + checkpoint_marker + "\n\n" + """### 已验证节点

- 原版编译后 Action manifest、三套 locale、16/19/24/32 静态图标、目标 Popup、默认标题、`tabs` 权限与 `Alt+Shift+O` 已进入永久构建审计。
- `browser.action` / `browser.i18n` / `browser.tabs` / OffscreenCanvas 的真实构造边界已通过 CI 与双浏览器构建，但尚未在后台注册。
- Profile workflow 仅在成功响应携带 `appliedSnapshotId` 时发出激活通知；Draft 编辑、查询和失败命令不会误触发全标签页刷新。
- 仓库状态 resolver 已验证 Direct、System，以及静态 Fixed 最终仍落到自身代理 endpoint 的状态。
- Fixed bypass/Direct 被主动保留为 unresolved；不得用简化 Direct 文案代替原版条件 trace。

### 原版结果详情约束

原版 `actionForUrl` 从完整 `matchProfile.results` 生成多行详情。默认规则、匹配条件、附属 Rule List、临时规则和 Direct 结果分别拥有不同字符串结构与前缀。仅知道最终 route 不足以还原标题。因此后续图谱新增硬边：

```mermaid
graph LR
  MATCH[matchProfile results trace] --> DETAIL[原版多行详情]
  DETAIL --> TITLE[三参数 Action 标题]
  MATCH --> RESULT[结果 Profile / Direct]
  RESULT --> COLOR[结果色 + 当前色]
  MATCH --> PREFIX[临时规则 / 附属规则前缀]
  PREFIX --> DETAIL
```

### 当前禁止边

- 禁止在 trace 未完整时启用 coordinator 覆盖全部 Profile 状态。
- 禁止让 coordinator 与 Inspect 同时直接写 Action。
- 禁止把 Fixed bypass、Switch、Rule List、Virtual、PAC 的最终 route 当作完整原版详情。
- 禁止因隔离单测和永久门禁绿色而上调产品完成度；总进度仍为 47%，Order 1 仍为 35%。

### 精确检查点

Head `e0ec31bd88ce4ff2d40937daee0b63def45fb2e8`：CI `30615270403`、Browser E2E `30615270448`、Parity `30615270389`、Visual `30615270430` 全部通过。
""".rstrip() + "\n"
kg_path.write_text(kg, encoding="utf-8")
