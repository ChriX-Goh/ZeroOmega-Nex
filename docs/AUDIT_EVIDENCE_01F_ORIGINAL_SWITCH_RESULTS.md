# Audit Evidence 01F — Original ZeroOmega v3.5.0 Switch Result Runtime

## Authority

- Package: official `chromium-release.zip` from ZeroOmega release `v3.5.0`.
- Package SHA-256: `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`.
- Runtime browser: Chromium `149.0.7827.55` on Ubuntu 24.04 GitHub runner.
- Resolved extension ID: `cofiboofgeodafifnjhmngjfibbnpgjg`.
- Workflow run: `30673848467`.
- Artifact: `original-toolbar-switch-results-v3.5.0`, ID `8809737989`.
- Artifact digest: `sha256:9c43b0d0554c6f6556a1e8bbc9fde8275e05f499d524d0021d1adb8ea0865f1a`.

The probe called the original package's real background `_actionForUrl` method through an installed Options-page message bridge. It enabled result Badge text, added one Fixed profile and one Switch profile through the original `addProfile` API, applied the Switch through the original `applyProfile` API and captured the returned Action contract with dynamic icon bytes skipped. The captured `resultColor` and `profileColor` remain the exact inputs used by the original renderer.

## Original Switch profile

- Current profile: `Runtime Switch`.
- Current color: `#ffb74d`.
- Rule 1: host wildcard `direct-match.test` → built-in `direct`.
- Rule 2: host wildcard `fixed-match.test` → `Runtime Fixed`.
- Default result: built-in `direct`.
- `Runtime Fixed`: color `#64b5f6`, fallback `PROXY 127.0.0.1:18181`.
- Result Badge option: enabled.

## Exact original Action results

| Case           | Current          | Result          | Details after title header                                   | Badge  | Result color | Current/profile color | Prefix |
| -------------- | ---------------- | --------------- | ------------------------------------------------------------ | ------ | ------------ | --------------------- | ------ |
| matched Direct | `Runtime Switch` | `[Direct]`      | `direct-match.test => [Direct]\n`                            | `Dire` | `#aaaaaa`    | `#ffb74d`             | empty  |
| matched Fixed  | `Runtime Switch` | `Runtime Fixed` | `fixed-match.test => Runtime Fixed\nPROXY 127.0.0.1:18181\n` | `Runt` | `#64b5f6`    | `#ffb74d`             | empty  |
| default Direct | `Runtime Switch` | `[Direct]`      | `(default) => [Direct]\n`                                    | `Dire` | `#aaaaaa`    | `#ffb74d`             | empty  |

Exact titles:

```text
ZeroOmega:: Runtime Switch
direct-match.test => [Direct]
```

```text
ZeroOmega:: Runtime Switch
fixed-match.test => Runtime Fixed
PROXY 127.0.0.1:18181
```

```text
ZeroOmega:: Runtime Switch
(default) => [Direct]
```

The matched/default Direct cases therefore use the original two-color contract: Direct as the result/outer color and the active Switch as the current/inner color. The visible result and optional Badge use the localized built-in Direct name, while the current title remains the Switch name.

## System result boundary

The original runtime's `validResultProfiles` for this Switch contained:

- `auto switch`;
- `proxy`;
- `Runtime Fixed`;
- `direct`.

It did **not** contain `system`. A deliberately constructed Switch that referenced `system` could be stored, but the original `applyProfile` path rejected it with:

```text
SystemProfile cannot be used in PAC scripts
```

Therefore Switch → System is not an original valid result state to reproduce. Nex must keep that shape fail-closed or reject it at the applicable validation/UI boundary; it must not invent an Action representation for it.

## Acceptance consequence

Source plus exact package runtime now establish the visible Switch result contract for:

- matched Switch → Direct;
- default Switch → Direct;
- matched Switch → Fixed proxy.

Nested profiles, attached Rule Lists, PAC, Virtual, temporary rules and external-control overlays remain separate evidence gates. This evidence does not close a toolbar matrix row or replace repository-owner acceptance.
