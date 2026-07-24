# ZeroOmega Built-in Profile Customization

Status: source-derived inventory pinned to ZeroOmega `v3.5.0`.

## 1. Built-in profiles

The profile model defines exactly two built-in profiles:

| Key       | Name     | Type            | Default color | Built-in flag |
| --------- | -------- | --------------- | ------------- | ------------- |
| `+direct` | `direct` | `DirectProfile` | `#aaaaaa`     | `true`        |
| `+system` | `system` | `SystemProfile` | `#000000`     | `true`        |

These profiles are program constants rather than ordinary user `+profile` objects.

## 2. Lookup precedence

Profile lookup checks the built-in profile map before the ordinary option container.

Consequences:

- an ordinary `+direct` or `+system` object cannot replace the built-in routing semantics;
- the names `direct` and `system` are effectively reserved;
- imported user profiles using either reserved name must be rejected or renamed through an explicit conflict workflow;
- references to `direct` and `system` resolve to the built-in profiles, not to similarly named user objects.

The profile enumerator also appends the two built-ins after ordinary option profiles. Nex should model built-ins separately rather than storing them as ordinary editable profiles.

## 3. Purpose of `-builtinProfiles`

The `-builtinProfiles` option is a presentation customization layer. In the pinned implementation, only the `color` value is consumed from it.

The profile model performs a top-level merge of:

1. the built-in profile constants; and
2. `options['-builtinProfiles']`.

For each built-in profile lookup, the model then copies only the merged entry's `color` onto the built-in profile object.

No code in the pinned profile model uses `-builtinProfiles` to replace:

- `name`;
- `profileType`;
- `builtin`;
- routing behavior;
- proxy endpoints;
- rules;
- default profiles;
- PAC behavior.

Any such fields present in a backup are non-authoritative legacy data.

## 4. UI-emitted shape

The built-in settings page contains two color pickers: one for System and one for Direct.

When the user moves a color picker, the UI writes a JSON-cloned map to `-builtinProfiles`. The normal UI-emitted shape is:

```json
{
  "-builtinProfiles": {
    "+system": {
      "name": "system",
      "profileType": "SystemProfile",
      "color": "#000000",
      "builtin": true
    },
    "+direct": {
      "name": "direct",
      "profileType": "DirectProfile",
      "color": "#aaaaaa",
      "builtin": true
    }
  }
}
```

Although the UI writes complete cloned profile objects, the runtime treats only `color` as customization input.

## 5. Shallow-merge edge cases

The merge is shallow at the `+direct` and `+system` entry level.

Therefore a manually edited value such as:

```json
{
  "-builtinProfiles": {
    "+direct": {
      "color": "#ffffff"
    }
  }
}
```

can still supply the Direct color because the model reads only that field. However, if an entry exists without a valid `color`, the merged entry can replace the default object and yield an undefined or invalid presentation color.

Nex must validate each customization independently and fall back to its built-in default when the supplied color is missing or invalid.

## 6. Backup and synchronization behavior

`-builtinProfiles` is stored inside the ordinary option container.

As a result:

- ordinary `.bak` export includes it;
- the observed synchronization transform does not filter it;
- it is user preference data rather than device/session runtime state;
- it contains no secret by design.

## 7. Unnecessary routing reapplication in the legacy implementation

The legacy options manager treats any `-builtinProfiles` change as affecting the current profile and reapplies the current routing profile.

This is not required by the actual semantics because the only supported customization is color.

Nex requirement:

> Changing a built-in profile color must update UI state only. It must not recompile PAC, reinstall browser proxy settings, interrupt connections, or activate a new runtime snapshot.

## 8. Nex migration contract

For `-builtinProfiles`:

1. Recognize only the keys `+direct` and `+system` as known built-in customizations.
2. Map a valid `color` from each known entry into a dedicated UI preference.
3. Preserve the original legacy object in namespaced import metadata when needed for audit or diagnostics.
4. Ignore `name`, `profileType`, and `builtin` as authoritative inputs; verify them only for migration reporting.
5. Reject any attempt to use this field to alter routing semantics.
6. Warn about unknown keys or routing-like fields rather than silently enabling them.
7. Fall back to Nex defaults for missing or invalid colors.
8. Keep built-in stable IDs independent from user profile IDs.

Recommended normalized representation:

```json
{
  "builtInProfileAppearance": {
    "direct": {
      "color": "#aaaaaa"
    },
    "system": {
      "color": "#000000"
    }
  }
}
```

This representation makes it structurally impossible for appearance settings to alter routing behavior.

## 9. Pinned source evidence

- `omega-pac/src/profiles.coffee` — built-in constants, lookup precedence, enumeration, and color decoration.
- `omega-web/src/omega/app.coffee` — exports the built-in map into the UI and registers the built-in settings page.
- `omega-web/src/omega/controllers/builtin.coffee` — merges customization objects and writes `-builtinProfiles` after color changes.
- `omega-web/src/partials/builtin.jade` — exposes only System and Direct color pickers.
- `omega-target/src/options.coffee` — reacts to `-builtinProfiles` changes by reapplying the current profile.

No ProfileSpec or importer implementation is introduced in this research milestone.
