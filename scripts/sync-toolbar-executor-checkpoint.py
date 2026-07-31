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
    """Implemented and tested:

- one browser-API boundary for `setIcon`, `setTitle`, `setBadgeText`, `setBadgeBackgroundColor` and `setPopup`;
- every application rewrites all tab-visible fields to clear stale state;
- rejected dynamic ImageData falls back to the supplied original static icon paths.

Remaining:

- bind the adapter to the real target-specific `browser.action` API;
- supply exact target Popup/default constants and original static assets;
- connect derived tab state, localization and rendered ImageData through the coordinator.

No browser API mutation occurs inside the pure state model.""",
    """Implemented and tested:

- one browser-API boundary for `setIcon`, `setTitle`, `setBadgeText`, `setBadgeBackgroundColor` and `setPopup`;
- every application rewrites all tab-visible fields to clear stale state;
- rejected dynamic ImageData falls back to the supplied original static icon paths;
- exact original default/result/detail localization keys with the original three-substitution title order and fail-closed missing-message behavior;
- one isolated executor that composes pure tab state → original localization → exact renderer → Action presentation while injecting target Popup, Badge background and fallback assets.

Remaining:

- bind the adapter to the real target-specific `browser.action` API;
- add the exact source-captured locale messages to the target locale packs;
- supply exact target Popup/default constants and original static assets;
- invoke the executor through the per-tab coordinator.

No browser API mutation occurs inside the pure state model.""",
    "TO-04 executor",
)
order = replace_once(
    order,
    """Exact engineering checkpoint Head `326c49ac30efc76d3884e63791dce3bbfb69722a` passed:

- CI `30598899116`;
- Browser E2E `30598899117`, including Firefox `153.0` through BiDi extension-page navigation;
- Parity Documentation `30598899120`;
- Milestone 8 Visual Evidence `30598899111`.

This validates the isolated Action adapter, exact Canvas renderer and Firefox 153 E2E harness correction. It does not close a `TB-*` row because no product runtime integration or owner acceptance exists yet.""",
    """Exact engineering checkpoint Head `36f75cc616e92c8e8c0dac503548a4a3780e825b` passed:

- CI `30599857786`;
- Browser E2E `30599857787`, including Firefox `153.0`;
- Parity Documentation `30599857743`;
- Milestone 8 Visual Evidence `30599857785`.

This validates the isolated Action adapter, exact Canvas renderer, original localization adapter and pure Action executor. It does not close a `TB-*` row because no product runtime integration or owner acceptance exists yet.""",
    "order checkpoint",
)
order = replace_once(
    order,
    """1. Capture the exact original title/localization templates and target Popup/default constants; do not hard-code English.
2. Compose pure tab state → exact renderer → Action adapter in a runtime executor.
3. Implement `TO-05` per-tab coordinator.
4. Convert Inspect direct writes into coordinator input.
5. Verify two-target, two-tab and state-transition behavior.
6. Deliver the exact build for repository-owner review.""",
    """1. Implement `TO-05` as an isolated, race-safe per-tab coordinator around the verified executor.
2. Add exact target locale messages, Popup/default constants and original fallback assets before real Action binding.
3. Bind the coordinator to `tabs.onUpdated`, `tabs.onActivated` and profile-change refresh only after its event semantics are tested.
4. Convert Inspect direct writes into coordinator input.
5. Verify two-target, two-tab and state-transition behavior.
6. Deliver the exact build for repository-owner review.""",
    "order next action",
)
order_path.write_text(order, encoding="utf-8")

index_path = Path("docs/ACTIVE_PARITY_AUDIT_INDEX.md")
index = index_path.read_text(encoding="utf-8")
index = replace_once(
    index,
    "- the tested Action adapter and Canvas renderer are not connected to runtime state;",
    "- the tested Action adapter, Canvas renderer, original localization adapter and pure executor are not connected to runtime state;",
    "index gap",
)
index = replace_once(
    index,
    """- `original-toolbar-action-adapter.ts` and its test centralize all per-tab Action writes and static fallback;
- `original-toolbar-icon-renderer.ts` and its test reproduce the original one-canvas, five-size, cached ImageData pipeline and privacy fallback signal;
- no manifest, toolbar permission, per-tab coordinator or tab-event product behavior has been changed yet;""",
    """- `original-toolbar-action-adapter.ts` and its test centralize all per-tab Action writes and static fallback;
- `original-toolbar-icon-renderer.ts` and its test reproduce the original one-canvas, five-size, cached ImageData pipeline and privacy fallback signal;
- `original-toolbar-i18n.ts` and its test lock the original default/result/detail keys, three-substitution order and fail-closed missing-message behavior;
- `original-toolbar-action-executor.ts` and its test compose pure tab state, original localization, rendered ImageData and target constants into one Action presentation;
- no manifest, locale pack, toolbar permission, per-tab coordinator or tab-event product behavior has been changed yet;""",
    "index implementation",
)
index = replace_once(
    index,
    """### Last fully green engineering slice

Head `326c49ac30efc76d3884e63791dce3bbfb69722a` passed:

- CI `30598899116`;
- Browser E2E `30598899117`, including Firefox `153.0` through WebDriver BiDi navigation for all extension pages;
- Parity Documentation `30598899120`;
- Milestone 8 Visual Evidence `30598899111`.

The slice validates the isolated Action adapter, exact icon renderer and permanent Firefox 153 E2E harness. It does not close a toolbar row or authorize a candidate.""",
    """### Last fully green engineering slice

Head `36f75cc616e92c8e8c0dac503548a4a3780e825b` passed:

- CI `30599857786`;
- Browser E2E `30599857787`, including Firefox `153.0`;
- Parity Documentation `30599857743`;
- Milestone 8 Visual Evidence `30599857785`.

The slice validates the isolated Action adapter, exact icon renderer, original localization adapter and pure executor. It does not close a toolbar row or authorize a candidate.""",
    "index checkpoint",
)
index_path.write_text(index, encoding="utf-8")
