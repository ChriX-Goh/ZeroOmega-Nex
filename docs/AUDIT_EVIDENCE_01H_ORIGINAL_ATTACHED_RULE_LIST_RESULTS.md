# Audit Evidence 01H — Original ZeroOmega v3.5.0 Attached Rule List Results

## Authority

- Package: official `chromium-release.zip` from ZeroOmega release `v3.5.0`.
- Package SHA-256: `4fc320af32461a7efc7d6b7a700100522af29afa6bd1270aef193f9121b160ce`.
- Runtime browser: Chromium `149.0.7827.55` on Ubuntu 24.04 GitHub runner.
- Resolved extension ID: `cofiboofgeodafifnjhmngjfibbnpgjg`.
- Successful workflow run: `30679236910`.
- Artifact: `original-toolbar-attached-rule-list-results-v3.5.0`, ID `8811619004`.
- Artifact digest: `sha256:6b92c6f5d0a63c8176abdebbc339f983ca71d50d39ad03b6b3cbfd58749e5d36`.

The probe called the installed original package's real background `_actionForUrl` method through the Options-page message bridge. It enabled result Badge text, added one Fixed target, two parent Switch profiles and two hidden attached `RuleListProfile` profiles through the original `addProfile` API, applied each parent through the original `applyProfile` API and captured the returned Action contract with dynamic icon bytes skipped.

## Original attached structure

The runtime probe reproduces the source-defined structure:

- hidden name: `__ruleListOf_<parent Switch name>`;
- parent Switch `defaultProfileName`: hidden Rule List name;
- hidden profile type: `RuleListProfile`;
- hidden profile color: parent Switch color;
- Rule List format: `AutoProxy`;
- Rule List match and default targets remain explicit profile references.

The parent Switch profiles contain no ordinary rules in this focused capture. This isolates the attached-list result chain from earlier parent-rule selection.

## Exact original AutoProxy compatibility boundary

ZeroOmega v3.5.0's `omega-pac/src/rule_list.coffee` converts an AutoProxy `||host` line to `HostWildcardCondition` pattern `*.host`. It does **not** remove a trailing separator marker.

Therefore:

- `||attached-fixed.test` matches the captured host;
- `||attached-fixed.test^` becomes the literal pattern `*.attached-fixed.test^` and does not match.

Diagnostic run `30679139515`, Artifact `8811581948`, preserved this first no-match result. The successful evidence uses the exact v3.5.0-compatible lines without `^`.

## Exact original Action results

### Attached match → Fixed

```text
ZeroOmega:: Runtime Attached Fixed Switch
(RL) ||attached-fixed.test => Runtime Attached Fixed
PROXY 127.0.0.1:18183
```

- result: `Runtime Attached Fixed`;
- Badge: `Runt`;
- `prefix`: `(RL) `;
- result/outer color: `#64b5f6`;
- current/inner color: `#5b5`.

### Attached no-match default → Direct

```text
ZeroOmega:: Runtime Attached Fixed Switch
(default) => [Direct]
```

- result: `[Direct]`;
- Badge: `Dire`;
- `prefix`: empty;
- result/outer color: `#aaaaaa`;
- current/inner color: `#5b5`.

The original does not append a second Direct-description line.

### Attached match → Direct

```text
ZeroOmega:: Runtime Attached Direct Switch
(RL) ||attached-direct.test => [Direct]
```

- result: `[Direct]`;
- Badge: `Dire`;
- `prefix`: `(RL) `;
- result/outer color: `#aaaaaa`;
- current/inner color: `#d63`.

### Attached no-match default → Fixed

```text
ZeroOmega:: Runtime Attached Direct Switch
(default) => Runtime Attached Fixed
PROXY 127.0.0.1:18183
```

- result: `Runtime Attached Fixed`;
- Badge: `Runt`;
- `prefix`: empty;
- result/outer color: `#64b5f6`;
- current/inner color: `#d63`.

## Source/runtime consequences

1. The parent Switch default transition into the hidden attached profile is not shown.
2. A matched attached rule receives the localized `(RL) ` prefix exactly once.
3. The displayed condition is the parser-preserved original `source` line, not the normalized condition pattern.
4. A no-match attached default is displayed as the ordinary localized `(default)` transition and has no `(RL)` prefix.
5. A result directly into built-in Direct does not append the standalone Direct-description line.
6. A Fixed result appends the final PAC-result line after the attached or default transition.
7. Badge and outer/result color come from the final result; the inner/current color remains the visible parent Switch color.

## Acceptance boundary

Source plus exact package runtime establish these focused shapes:

- parent Switch with no ordinary matched rule;
- one directly attached AutoProxy Rule List;
- matched attached source into built-in Direct or one Fixed proxy target;
- attached no-match default into built-in Direct or one Fixed proxy target.

Parent Switch rule fallthrough before the attached list, AutoProxy exclusive rules, Switchy formats, Rule List results into another inclusive profile, Fixed bypass after an attached match, temporary-rule overlays and external-control states remain separate evidence gates. Unsupported shapes must remain fail-closed. This evidence does not close a toolbar matrix row or replace repository-owner acceptance.
