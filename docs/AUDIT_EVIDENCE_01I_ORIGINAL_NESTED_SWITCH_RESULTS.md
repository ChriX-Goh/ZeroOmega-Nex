# Audit Evidence 01I — Original ZeroOmega v3.5.0 Nested Switch Results

## Authority

- Package: official `chromium-release.zip` from ZeroOmega release `v3.5.0`.
- Package SHA-256: `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`.
- Runtime browser: Chromium `149.0.7827.55` on Ubuntu 24.04 GitHub runner.
- Resolved extension ID: `cofiboofgeodafifnjhmngjfibbnpgjg`.
- Successful workflow run: `30712802618`.
- Artifact: `original-toolbar-evidence-v3.5.0`, ID `8822417287`.
- Artifact digest: `sha256:0b2e2051234a46c326d83ae3ed64324e48ceef61477b2e3cedb310b8ea7db31e`.
- Scenario: `nested-switch` in the permanent read-only parameterized `Original Toolbar Evidence` workflow.

The runner downloaded and hash-verified the exact official package, installed it in real Chromium, created the profiles through the original `addProfile` API, applied the outer profile through the original `applyProfile` API and captured the original background `_actionForUrl` result through an installed Options-page message bridge. Dynamic icon bytes were skipped; the exact title, current/result names, Badge, result color and current profile color were retained.

## Original profile graph

- `Runtime Nested Outer Switch`, color `#ffb74d`:
  - `nested-fixed.test` → `Runtime Nested Inner Switch`;
  - `nested-direct.test` → `Runtime Nested Inner Switch`;
  - default → built-in Direct.
- `Runtime Nested Inner Switch`, color `#81c784`:
  - `nested-fixed.test` → `Runtime Nested Fixed`;
  - default → built-in Direct.
- `Runtime Nested Fixed`, color `#64b5f6`:
  - fallback `PROXY 127.0.0.1:18184`;
  - no bypass entries.
- Result Badge option: enabled.

## Exact original Action results

### Outer match → inner match → Fixed

```text
ZeroOmega:: Runtime Nested Outer Switch
nested-fixed.test => Runtime Nested Inner Switch
nested-fixed.test => Runtime Nested Fixed
PROXY 127.0.0.1:18184
```

- current: `Runtime Nested Outer Switch`;
- result: `Runtime Nested Fixed`;
- Badge: `Runt`;
- result/outer color: `#64b5f6`;
- current/inner color: `#ffb74d`;
- prefix: empty.

### Outer match → inner default → Direct

```text
ZeroOmega:: Runtime Nested Outer Switch
nested-direct.test => Runtime Nested Inner Switch
(default) => [Direct]
```

- current: `Runtime Nested Outer Switch`;
- result: `[Direct]`;
- Badge: `Dire`;
- result/outer color: `#aaaaaa`;
- current/inner color: `#ffb74d`;
- prefix: empty.

### Outer default → Direct

```text
ZeroOmega:: Runtime Nested Outer Switch
(default) => [Direct]
```

- current: `Runtime Nested Outer Switch`;
- result: `[Direct]`;
- Badge: `Dire`;
- result/outer color: `#aaaaaa`;
- current/inner color: `#ffb74d`;
- prefix: empty.

## Source/runtime consequences

1. The visible current profile remains the originally applied outer Switch.
2. Every selected nested Switch edge is shown in order.
3. A matched edge displays the condition and the immediate target profile name, even when that target is another Switch rather than the final result.
4. An inner default displays the ordinary localized `(default)` transition.
5. The final Fixed proxy line is appended only after all visible Switch transitions.
6. Result name, Badge and outer color come from the final resolved result.
7. The Action inner/current color remains the applied outer Switch color; the intermediate Switch color is not exposed in the final icon inputs.
8. An outer direct default remains the existing one-level Switch contract and does not create a synthetic nested line.

## Acceptance boundary

This evidence establishes only:

- one applied outer Switch;
- one matched outer rule targeting one inner Switch;
- inner matched rule → one Fixed proxy;
- inner default → built-in Direct;
- outer default → built-in Direct.

Outer default → inner Switch, more than two Switch levels, nested attached Rule Lists, nested Virtual/PAC targets, Fixed bypass after a nested selection, indeterminate conditions and target-dependent results remain separate evidence gates. Unsupported shapes must remain fail-closed. This evidence does not close `KG-ICON-001` or replace repository-owner acceptance.
