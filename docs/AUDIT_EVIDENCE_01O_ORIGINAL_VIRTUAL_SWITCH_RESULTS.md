# Audit Evidence 01O — Original Virtual → Switch Results

## Scope

This evidence captures the observable ZeroOmega v3.5.0 Chromium Toolbar contract for one applied Virtual profile whose immediate target is one ordinary Switch profile.

The represented subset is intentionally narrow:

- outer Virtual → inner Switch;
- one matched host-wildcard rule → one Fixed HTTP fallback proxy;
- one matched host-wildcard rule → built-in Direct;
- inner Switch default → built-in Direct;
- no attached Rule List, bypass, deeper Switch, PAC, System or other mixed target.

## Provenance

The permanent read-only `Original Toolbar Evidence` workflow downloaded the official ZeroOmega v3.5.0 Chromium release and verified:

```text
4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce  chromium-release.zip
```

The parameterized `virtual-switch` scenario ran in an isolated real Chromium profile through the original runtime APIs and `_actionForUrl`.

Successful original evidence:

- workflow run: `30735001968`;
- Artifact: `8829253365`;
- Artifact digest: `sha256:96508ac2e993c34478e3b832349a914205a8df4b29cc2e07064a1cc06ad7d272`;
- Chromium: `149.0.7827.55`;
- original extension ID: `cofiboofgeodafifnjhmngjfibbnpgjg`.

The same scenario remains part of the permanent `all` registry and passed on the final implementation Head through Original Toolbar Evidence run `30735592123`.

## Original fixture

### Final Fixed profile

```text
name: Runtime Virtual Switch Fixed
color: #64b5f6
fallback: PROXY 127.0.0.1:18190
bypass: none
```

### Immediate Switch target

```text
name: Runtime Virtual Switch Inner
color: #81c784
virtual-switch-fixed.test  -> Runtime Virtual Switch Fixed
virtual-switch-direct.test -> [Direct]
default                    -> [Direct]
```

### Applied Virtual profile

```text
name: Runtime Virtual Switch Outer Alias
color: #ff8a65
target: Runtime Virtual Switch Inner
```

## Captured results

### 1. Inner matched rule → Fixed

Target URL:

```text
http://virtual-switch-fixed.test/path
```

Exact original title/detail:

```text
ZeroOmega:: Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]
virtual-switch-fixed.test => Runtime Virtual Switch Fixed
PROXY 127.0.0.1:18190
```

Observable state:

- visible current name: `Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]`;
- result name: `Runtime Virtual Switch Fixed`;
- Badge: `Runt`;
- result/outer icon color: `#64b5f6`;
- current/inner icon color: `#81c784`.

### 2. Inner matched rule → Direct

Target URL:

```text
http://virtual-switch-direct.test/path
```

Exact original title/detail:

```text
ZeroOmega:: Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]
virtual-switch-direct.test => [Direct]
```

Observable state:

- visible current name remains the outer Virtual plus immediate Switch;
- result name: `[Direct]`;
- Badge: `Dire`;
- result/outer icon color: `#aaaaaa`;
- current/inner icon color: `#81c784`.

### 3. Inner default → Direct

Target URL:

```text
http://virtual-switch-default.test/path
```

Exact original title/detail:

```text
ZeroOmega:: Runtime Virtual Switch Outer Alias [Runtime Virtual Switch Inner]
(default) => [Direct]
```

Observable state:

- visible current name remains the outer Virtual plus immediate Switch;
- result name: `[Direct]`;
- Badge: `Dire`;
- result/outer icon color: `#aaaaaa`;
- current/inner icon color: `#81c784`.

## Derived original contract

For this captured family:

1. The applied outer Virtual remains the primary current profile.
2. The immediate Switch target is appended once in square brackets.
3. The outer Virtual transition itself is hidden from the detail lines.
4. The inner Switch matched rule or localized `(default)` transition remains visible.
5. The immediate Switch supplies the current/inner icon color.
6. The final Fixed or Direct route supplies the result name, Badge and result/outer icon color.
7. The applied outer Virtual color does not appear in the final two-color icon for this family.

## Nex mapping

Nex reproduces the captured subset through the dedicated `projectOriginalVirtualSwitchTrace` subprojector composed into the unified Original-observable result projector.

Accepted trace shape:

- exact resolved graph decision;
- one colored outer Virtual targeting one colored ordinary Switch;
- exactly one outer `virtual` transition;
- no attached Rule List on the inner Switch;
- direct result through one matched host-wildcard Direct rule or exactly one Direct default;
- fixed result through one matched host-wildcard rule into one colored Fixed profile;
- Fixed profile has no bypass;
- resolved endpoint is the Fixed fallback endpoint;
- no HTTP-specific override;
- endpoint protocol is HTTP;
- exact `fixed-endpoint` trace.

The implementation fails closed for deeper Switch chains, bypass, attached Rule List, PAC, System and uncaptured mixed shapes.

## Verification

Deterministic tests verify:

- matched inner rule → Fixed;
- matched inner rule → Direct;
- inner default → Direct;
- inner Switch → another Switch remains unrepresented and returns no Original projection.

Real browser verification is included in the existing shared profile-trace matrix rather than a new workflow:

- Chromium Browser E2E run `30735592100`, `Run Chromium Toolbar profile trace E2E`: success;
- Firefox Browser E2E run `30735592100`, `Run Firefox Toolbar profile trace E2E`: success.

The first Chromium job attempt in that run timed out in the older unrelated full-Popup external-profile step before reaching profile-trace. Re-running that single job without code changes passed the full E2E and every subsequent Toolbar step, including 01O. The final workflow conclusion is success.

## Represented subset

For 01O:

- edge: `EXACT_EQUIVALENT`;
- evidence status: `VERIFIED_AUTOMATION`.

## Unrepresented shapes

The following remain open or fail closed:

- Virtual → Switch → Switch or deeper chains;
- inner Switch attached Rule List;
- Switch rules/defaults into Virtual, Rule List, PAC, System or target-dependent routes;
- Fixed bypass and scheme-specific proxy mappings;
- multiple or non-host-wildcard conditions;
- disabled profiles/rules, cycles and depth errors;
- lifecycle, restart and owner visual acceptance.

This closes only the strict 01O mixed Virtual → Switch subset. It does not close `KG-ICON-001`, Order 1 or repository-owner acceptance.
