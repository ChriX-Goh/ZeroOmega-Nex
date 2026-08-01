# Audit Evidence 01J — Original ZeroOmega v3.5.0 Nested Virtual Results

## Authority

- Package: official `chromium-release.zip` from ZeroOmega release `v3.5.0`.
- Package SHA-256: `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`.
- Runtime browser: Chromium `149.0.7827.55` on Ubuntu 24.04 GitHub runner.
- Resolved extension ID: `cofiboofgeodafifnjhmngjfibbnpgjg`.
- Successful workflow run: `30715454796`.
- Artifact: `original-toolbar-evidence-v3.5.0`, ID `8823191695`.
- Artifact digest: `sha256:dd86f0ede5718521eb76aadf915be55ae053f960dd06acb0eb0df6436659edae`.
- Scenario: `nested-virtual` in the permanent read-only parameterized `Original Toolbar Evidence` workflow.

The workflow downloaded and hash-verified the exact official package, installed it in real Chromium, created the profiles through the original `addProfile` API, applied each outer Virtual through the original `applyProfile` API and captured the original background `_actionForUrl` result through the installed Options-page message bridge. Dynamic icon bytes were skipped; exact title, current/result names, Badge, result color and profile color were retained.

## Original profile graph

- `Runtime Nested Virtual Fixed`, color `#64b5f6`:
  - fallback `PROXY 127.0.0.1:18185`;
  - bypass `localhost`.
- `Runtime Nested Virtual Inner Fixed Alias`, color `#81c784`:
  - Virtual default target → `Runtime Nested Virtual Fixed`.
- `Runtime Nested Virtual Outer Fixed Alias`, color `#ffb74d`:
  - Virtual default target → `Runtime Nested Virtual Inner Fixed Alias`.
- `Runtime Nested Virtual Inner Direct Alias`, color `#9575cd`:
  - Virtual default target → built-in Direct.
- `Runtime Nested Virtual Outer Direct Alias`, color `#ff8a65`:
  - Virtual default target → `Runtime Nested Virtual Inner Direct Alias`.
- Result Badge option: enabled.

Distinct outer, inner and final colors were intentional. They expose which profile supplies each Action color input.

## Exact original Action results

### Outer Virtual → inner Virtual → Direct

```text
ZeroOmega:: Runtime Nested Virtual Outer Direct Alias [Runtime Nested Virtual Inner Direct Alias]
(default) => [Direct]
```

- current: `Runtime Nested Virtual Outer Direct Alias [Runtime Nested Virtual Inner Direct Alias]`;
- result: `[Direct]`;
- Badge: `Dire`;
- result/outer color: `#aaaaaa`;
- profile/inner color: `#9575cd`, the immediate inner Virtual color;
- prefix: empty.

### Outer Virtual → inner Virtual → Fixed proxy

```text
ZeroOmega:: Runtime Nested Virtual Outer Fixed Alias [Runtime Nested Virtual Inner Fixed Alias]
(default) => Runtime Nested Virtual Fixed
PROXY 127.0.0.1:18185
```

- current: `Runtime Nested Virtual Outer Fixed Alias [Runtime Nested Virtual Inner Fixed Alias]`;
- result: `Runtime Nested Virtual Fixed`;
- Badge: `Runt`;
- result/outer color: `#64b5f6`, the final Fixed color;
- profile/inner color: `#81c784`, the immediate inner Virtual color;
- prefix: empty.

### Outer Virtual → inner Virtual → Fixed bypass

```text
ZeroOmega:: Runtime Nested Virtual Outer Fixed Alias [Runtime Nested Virtual Inner Fixed Alias]
(default) => Runtime Nested Virtual Fixed
localhost => DIRECT
```

- current: `Runtime Nested Virtual Outer Fixed Alias [Runtime Nested Virtual Inner Fixed Alias]`;
- result: `Runtime Nested Virtual Fixed`;
- Badge: `Runt`;
- result/outer color: `#aaaaaa`, built-in Direct;
- profile/inner color: `#64b5f6`, the final Fixed color;
- prefix: empty.

## Source/runtime consequences

1. The visible current name contains the applied outer Virtual followed by only its immediate target in brackets.
2. The suffix does not recursively expand the inner Virtual or final target.
3. The applied outer Virtual default transition is suppressed.
4. The inner Virtual default transition is visible as the ordinary localized `(default)` line.
5. The inner transition names the final route target, followed by that target's own result details.
6. Result name and Badge come from the final resolved profile or built-in route.
7. For a Direct or proxy result, the Action profile/inner color comes from the immediate inner Virtual.
8. For a Fixed bypass result, the Action profile/inner color comes from the final Fixed profile while the result/outer color is Direct.
9. Fixed bypass uses the literal PAC result `DIRECT`, not the localized standalone Direct description.
10. The applied outer Virtual color is not exposed in the captured final Action color inputs.

## Acceptance boundary

This evidence establishes only:

- one applied outer Virtual;
- one immediate inner Virtual;
- inner Virtual → built-in Direct;
- inner Virtual → one Fixed proxy;
- inner Virtual → that Fixed profile's one captured bypass.

More than two Virtual levels, Virtual → Switch/Rule List/PAC, disabled profiles, cycles, multiple bypass entries, scheme-specific proxy mappings, temporary-rule prefixes, external-control overlays and target-dependent results remain separate evidence gates. Unsupported shapes must remain fail-closed. This evidence does not close `KG-ICON-001` or replace repository-owner acceptance.
