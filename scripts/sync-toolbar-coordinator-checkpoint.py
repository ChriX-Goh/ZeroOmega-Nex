from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


order_path = Path("docs/DELIVERY_ORDER_01_TOOLBAR_STATE.md")
order = order_path.read_text(encoding="utf-8")
order = replace_once(
    order,
    """### `TO-05` — per-tab coordinator

Status: `NOT STARTED`.

Required behavior:

- tab URL update and activation listeners;
- current-tab result calculation;
- dirty/stale state handling;
- internal URL fallback;
- tab-isolated result and Inspect state;
- profile-change invalidation and reset.""",
    """### `TO-05` — per-tab coordinator

Status: `PARTIAL`.

Implemented and tested in isolation:

- idempotent registration and removal of URL-update and tab-activation listeners;
- per-tab promise queues and monotonically increasing refresh sequences;
- lifecycle epochs that invalidate in-flight work after stop;
- stale async result suppression before Action mutation;
- missing/internal URL and unresolved-state fallback to the localized default state;
- resolver/Action error reporting with tab and URL context;
- all-tab refresh with optional icon-cache invalidation;
- omission of tabs without an ID.

Remaining:

- adapt the real `browser.tabs` API to the coordinator interfaces;
- supply the real source-derived resolver for profile/result/title/Badge state;
- bind startup, profile changes and recovery paths to all-tab refresh;
- represent Inspect as a coordinator input instead of direct Action writes;
- prove tab isolation and stale-state clearing against visible Action state in Chromium and Firefox.""",
    "TO-05 status",
)
order = replace_once(
    order,
    """Exact engineering checkpoint Head `36f75cc616e92c8e8c0dac503548a4a3780e825b` passed:

- CI `30599857786`;
- Browser E2E `30599857787`, including Firefox `153.0`;
- Parity Documentation `30599857743`;
- Milestone 8 Visual Evidence `30599857785`.

This validates the isolated Action adapter, exact Canvas renderer, original localization adapter and pure Action executor. It does not close a `TB-*` row because no product runtime integration or owner acceptance exists yet.""",
    """Exact engineering checkpoint Head `1045d538a17d8a24e0b80ca67054b54c7fb10aa8` passed:

- CI `30600481721`;
- Browser E2E `30600481704`, including Firefox `153.0`;
- Parity Documentation `30600481717`;
- Milestone 8 Visual Evidence `30600481719`.

This validates the isolated Action adapter, exact Canvas renderer, original localization adapter, pure Action executor and race-safe per-tab coordinator. It does not close a `TB-*` row because target constants, real browser binding, source-derived resolution and owner acceptance remain open.""",
    "order checkpoint",
)
order = replace_once(
    order,
    """1. Implement `TO-05` as an isolated, race-safe per-tab coordinator around the verified executor.
2. Add exact target locale messages, Popup/default constants and original fallback assets before real Action binding.
3. Bind the coordinator to `tabs.onUpdated`, `tabs.onActivated` and profile-change refresh only after its event semantics are tested.
4. Convert Inspect direct writes into coordinator input.
5. Verify two-target, two-tab and state-transition behavior.
6. Deliver the exact build for repository-owner review.""",
    """1. Add exact target locale messages, Popup/default constants and original fallback assets before real Action binding.
2. Adapt real `browser.action`, `browser.i18n` and `browser.tabs` APIs behind the verified boundaries.
3. Build the source-derived resolver for Direct/System/Fixed and default/internal-page states before advanced Switch/PAC inputs.
4. Bind startup, tab events and profile-change refresh through the coordinator.
5. Convert Inspect direct writes into coordinator input.
6. Verify two-target, two-tab and state-transition behavior before repository-owner review.""",
    "order next action",
)
order_path.write_text(order, encoding="utf-8")

index_path = Path("docs/ACTIVE_PARITY_AUDIT_INDEX.md")
index = index_path.read_text(encoding="utf-8")
index = replace_once(
    index,
    "- the tested Action adapter, Canvas renderer, original localization adapter and pure executor are not connected to runtime state;\n- no per-tab result coordinator or Action-state convergence exists;",
    "- the tested Action adapter, Canvas renderer, original localization adapter, pure executor and race-safe per-tab coordinator are not connected to real browser/runtime state;\n- no source-derived result resolver or real Action-state convergence exists;",
    "index gaps",
)
index = replace_once(
    index,
    """- `original-toolbar-action-executor.ts` and its test compose pure tab state, original localization, rendered ImageData and target constants into one Action presentation;
- no manifest, locale pack, toolbar permission, per-tab coordinator or tab-event product behavior has been changed yet;""",
    """- `original-toolbar-action-executor.ts` and its test compose pure tab state, original localization, rendered ImageData and target constants into one Action presentation;
- `original-toolbar-tab-coordinator.ts` and its test provide per-tab serialization, stale-result suppression, lifecycle invalidation, default fallback, all-tab refresh and icon-cache invalidation;
- no manifest, locale pack, toolbar permission, real browser binding, source-derived resolver or tab-event product behavior has been changed yet;""",
    "index implementation",
)
index = replace_once(
    index,
    """### Last fully green engineering slice

Head `36f75cc616e92c8e8c0dac503548a4a3780e825b` passed:

- CI `30599857786`;
- Browser E2E `30599857787`, including Firefox `153.0`;
- Parity Documentation `30599857743`;
- Milestone 8 Visual Evidence `30599857785`.

The slice validates the isolated Action adapter, exact icon renderer, original localization adapter and pure executor. It does not close a toolbar row or authorize a candidate.""",
    """### Last fully green engineering slice

Head `1045d538a17d8a24e0b80ca67054b54c7fb10aa8` passed:

- CI `30600481721`;
- Browser E2E `30600481704`, including Firefox `153.0`;
- Parity Documentation `30600481717`;
- Milestone 8 Visual Evidence `30600481719`.

The slice validates the isolated Action adapter, exact icon renderer, original localization adapter, pure executor and race-safe per-tab coordinator. It does not close a toolbar row or authorize a candidate.""",
    "index checkpoint",
)
index_path.write_text(index, encoding="utf-8")
