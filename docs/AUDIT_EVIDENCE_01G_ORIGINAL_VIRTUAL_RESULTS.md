# Audit Evidence 01G — Original ZeroOmega v3.5.0 Virtual Result Runtime

## Authority

- Package: official `chromium-release.zip` from ZeroOmega release `v3.5.0`.
- Package SHA-256: `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`.
- Runtime browser: Chromium `149.0.7827.55` on Ubuntu 24.04 GitHub runner.
- Resolved extension ID: `cofiboofgeodafifnjhmngjfibbnpgjg`.
- Successful workflow run: `30677618681`.
- Artifact: `original-toolbar-virtual-results-v3.5.0`, ID `8811046002`.
- Artifact digest: `sha256:f4485078f732e9d64294c13d2edd8cb09f26a3f1405dfa427f2d4072292ce2ed`.

The probe called the original package's real background `_actionForUrl` method through an installed Options-page message bridge. It enabled result Badge text, added one Fixed profile and two Virtual profiles through the original `addProfile` API, applied each Virtual profile through the original `applyProfile` API and captured the returned Action contract with dynamic icon bytes skipped. The captured `resultColor` and `profileColor` remain the exact inputs used by the original renderer.

The one-time audit also confirmed an original data-shape boundary: `VirtualProfile` reuses the `SwitchProfile` handler. Direct `addProfile` injection therefore needs the post-`Profiles.create` shape, including `rules: []`; otherwise original reference/PAC handling attempts to read `profile.rules.length`.

## Original profiles

- Fixed target: `Runtime Virtual Fixed`, color `#64b5f6`, fallback `PROXY 127.0.0.1:18182`, bypass `localhost`.
- Fixed alias: `Runtime Virtual Fixed Alias` → `Runtime Virtual Fixed`.
- Direct alias: `Runtime Virtual Direct Alias` → built-in `direct`.
- Result Badge option: enabled.

## Exact original Action results

| Case | Current name in title | Result name | Details after title header | Badge | Result color | Profile color |
| --- | --- | --- | --- | --- | --- | --- |
| Virtual → Direct | `Runtime Virtual Direct Alias [[Direct]]` | `[Direct]` | `(not using any proxy)` | `Dire` | `#aaaaaa` | `#aaaaaa` |
| Virtual → Fixed proxy | `Runtime Virtual Fixed Alias [Runtime Virtual Fixed]` | `Runtime Virtual Fixed` | `PROXY 127.0.0.1:18182\n` | `Runt` | `#64b5f6` | `#64b5f6` |
| Virtual → Fixed bypass | `Runtime Virtual Fixed Alias [Runtime Virtual Fixed]` | `Runtime Virtual Fixed` | `localhost => DIRECT\n` | `Runt` | `#aaaaaa` | `#64b5f6` |

Exact titles:

```text
ZeroOmega:: Runtime Virtual Direct Alias [[Direct]]
(not using any proxy)
```

```text
ZeroOmega:: Runtime Virtual Fixed Alias [Runtime Virtual Fixed]
PROXY 127.0.0.1:18182
```

```text
ZeroOmega:: Runtime Virtual Fixed Alias [Runtime Virtual Fixed]
localhost => DIRECT
```

## Source/runtime consequences

1. The visible current name is the Virtual name followed by ` [<localized target display name>]`.
2. Built-in Direct is already displayed as `[Direct]`; wrapping it for the Virtual suffix produces the exact double bracket `[[Direct]]`.
3. The Virtual default transition to its immediate target is suppressed from the multiline details.
4. Virtual → Direct falls back to the localized Direct description itself, without an added transition line or trailing newline.
5. Virtual → Fixed preserves only the target Fixed result details.
6. Badge text and result name come from the resolved target, not the Virtual alias.
7. The target's color is the current/profile color. A Fixed bypass uses Direct as result/outer color and the Fixed target as profile/inner color.

## Acceptance boundary

Source plus exact package runtime establish only these immediate-target shapes:

- Virtual → built-in Direct;
- Virtual → Fixed proxy;
- Virtual → Fixed bypass to Direct.

Nested Virtual, Virtual → Switch/Rule List/PAC, temporary-rule prefixes, external-control overlays and headed icon pixels remain separate evidence gates. Unsupported shapes must remain fail-closed. This evidence does not close a toolbar matrix row or replace repository-owner acceptance.
