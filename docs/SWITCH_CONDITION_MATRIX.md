# Switch Condition Matrix — ZeroOmega v3.5.0 Source Baseline

This document is the durable D-04/D-05 acceptance authority for Switch Profile condition types and fields.

## Source authority

- `zero-peak/ZeroOmega@v3.5.0`
- `omega-web/src/omega/controllers/switch_profile.coffee`
- `omega-web/src/partials/profile_switch.jade`
- `omega-pac/src/conditions.coffee`
- frozen source artifact `original-zeroomega-ui-evidence-v3.5.0`, ID `8625759489`

## Ordinary selectable UI matrix

| Original group  | Original type         | Nex kind        | Original field shape                          | Nex acceptance                                                   |
| --------------- | --------------------- | --------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Basic / Host    | HostWildcardCondition | `host-wildcard` | required pattern; warn on `:` or `/`          | selectable; one pattern input; warning restored                  |
| Basic / URL     | UrlWildcardCondition  | `url-wildcard`  | required pattern                              | selectable; one pattern input                                    |
| Basic / URL     | UrlRegexCondition     | `url-regex`     | required regex                                | selectable; invalid regex allowed in Draft and rejected by Apply |
| Basic / Special | FalseCondition        | `false`         | static Never, or disabled imported annotation | selectable; both forms retained                                  |
| Host            | HostRegexCondition    | `host-regex`    | required regex                                | selectable; invalid regex allowed in Draft and rejected by Apply |
| Host            | HostLevelsCondition   | `host-levels`   | required min/max number inputs, 1–99          | selectable; two bounded inputs                                   |
| Host            | IpCondition           | `ip`            | one required `address/prefix` input           | selectable; one combined CIDR input                              |
| URL             | KeywordCondition      | `keyword`       | required pattern                              | selectable; HTTP-only semantics retained by compiler/interpreter |
| Special         | WeekdayCondition      | `weekday`       | seven weekday checkboxes                      | selectable; seven typed checkboxes                               |
| Special         | TimeCondition         | `time`          | required start/end hour inputs, 0–23          | selectable; two bounded inputs                                   |

The advanced selector order is exactly:

`host-wildcard`, `host-regex`, `host-levels`, `ip`, `url-wildcard`, `url-regex`, `keyword`, `weekday`, `time`, `false`.

## Source/import compatibility-only kinds

| Model/source kind          | Original behavior                                                                                               | Nex behavior                                                                                                                           |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `true` / TrueCondition     | condition engine accepts it; Switch controller normalizes it to HostWildcard `*`; not offered in the selector   | retained when imported/source-edited, shown in a compatibility-only selected option, and explicitly normalizable to `host-wildcard: *` |
| `bypass` / BypassCondition | condition engine and source format accept it; Switch controller does not list it in basic or advanced selectors | retained when imported/source-edited and shown in a compatibility-only selected option; never offered for ordinary new selection       |

## Draft and Apply contract

- Every editor change first updates typed Draft state.
- Temporarily invalid patterns and regular expressions remain editable in Draft.
- Strict Apply validates the entire ProfileSpec and cannot replace Applied/browser state on failure.
- Corrected conditions can Apply normally and survive reload.
- Table-to-source and source-to-table round trips preserve supported fields.
- Chromium exercises all ten ordinary types, every field family, invalid-regex rejection, correction, source round trip, and final Apply.
- Firefox independently verifies the exact ten-option target matrix, source-only exclusion, combined IP field, False field, and ordinary pattern mutation.

## Permanent acceptance

D-04 and D-05 may remain `DONE` only while:

- the typed catalog preserves the exact original groups and order;
- `true` and `bypass` remain absent from ordinary selectable options;
- the original field shapes and warnings remain rendered;
- component, unit, Chromium, Firefox, parity, localization, and build gates pass.
