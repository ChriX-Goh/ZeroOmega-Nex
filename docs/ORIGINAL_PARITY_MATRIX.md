# Original ZeroOmega parity matrix

This matrix is checked against the original `zero-peak/ZeroOmega` Options and Popup source. A feature is not called compatible merely because a similar control exists.

| Original user surface                                         | ZeroOmega Nex status      | Acceptance evidence / remaining work                                                                         |
| ------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Browser toolbar icon and localized title                      | Implemented in this slice | Native `_locales` plus 16/32/48/128 PNG manifest icons                                                       |
| English default with automatic Simplified/Traditional Chinese | Implemented in this slice | `en`, `zh_CN`, `zh_TW`; all other system languages fall back to English                                      |
| Direct and System Proxy at top of Popup                       | Implemented in this slice | Fresh default order is Direct, System, then user profiles; explicit user reorder remains authoritative       |
| Fresh installation starts in Direct                           | Implemented in this slice | Initial workflow creation performs a real Direct activation transaction                                      |
| Colored profile-type icons                                    | Implemented in this slice | Direct, System, Fixed, Switch, Rule List, PAC, Auto Detect, and external icons                               |
| Popup follows Automatic/Light/Dark theme                      | Implemented in this slice | Shared extension-origin theme preference and system media query                                              |
| New and duplicated profiles append downward                   | Implemented in this slice | Profile and Quick Switch order tests                                                                         |
| Persistent Settings / Profiles / Actions Options layout       | Implemented               | Independent full-tab pages and profile editors                                                               |
| Original backup file import and immediate verified activation | Implemented               | Schema-v2 file/text import plus normal Apply transaction                                                     |
| Built-in profile color controls                               | Implemented               | Direct/System color inputs and colored type icons                                                            |
| Profile name and color controls                               | Implemented in this slice | Per-profile color input updates icon color throughout UI                                                     |
| Popup Options entry                                           | Implemented               | Bottom action opens the full Options tab                                                                     |
| Built-in and custom-profile divider                           | Implemented in this slice | Divider appears after Direct/System                                                                          |
| Result-profile dropdown for Switch/Virtual profiles           | Missing                   | Requires a persisted default-result command and Popup dropdown behavior                                      |
| Add condition for current website from Popup                  | Missing                   | Requires active-tab URL access and a typed rule mutation/apply transaction                                   |
| Temporary current-site rule menu                              | Missing                   | Requires an explicit non-persistent runtime override model and cleanup semantics                             |
| External profile controlled by another extension              | Missing                   | Requires browser proxy ownership inspection and a named external-state model                                 |
| Request-error list and bounded diagnostics                    | Missing                   | Must be implemented without restoring a permanent global routing listener                                    |
| Inspect/network traffic menu                                  | Missing                   | Requires opt-in, bounded diagnostics and permission UX                                                       |
| Full original Options feature inventory                       | In progress               | Every original menu/editor row must be marked implemented, intentionally changed, or missing before PR Ready |

## Closure rule

PR #11 remains Draft while any user-visible original feature is unclassified. Missing rows may be implemented in later slices, but cannot be described as already compatible.
