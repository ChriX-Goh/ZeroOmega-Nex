# Legacy Route Decision Vectors

Status: declarative Milestone 2 oracle inputs pinned to ZeroOmega `v3.5.0` semantics.

## Purpose

Decision vectors define expected routing behavior before the optimized interpreter, PAC compiler, or browser adapters exist.

They separate three questions:

1. How a legacy condition or rule-list line is parsed.
2. Whether a request matches the parsed condition.
3. Which result profile is selected in a minimal single-rule or ordered-list policy.

Milestone 2 records these expectations. Milestone 5 will execute them against the correctness-first reference interpreter, and later milestones will run the same vectors against PAC and browser backends.

## Files

### `condition-decisions.json`

Contains single-condition routing vectors using a common result model:

- a matching condition selects `fixed`;
- a nonmatching condition selects `direct`;
- `fixed` resolves to the documented HTTP proxy endpoint;
- `direct` resolves to direct connection.

The corpus includes positive and negative cases and covers all twelve recognized condition types:

- `TrueCondition`;
- `FalseCondition`;
- `UrlRegexCondition`;
- `UrlWildcardCondition`;
- `HostRegexCondition`;
- `HostWildcardCondition`;
- `BypassCondition`;
- `KeywordCondition`;
- `IpCondition`;
- `HostLevelsCondition`;
- `WeekdayCondition`;
- `TimeCondition`.

Local weekday and hour inputs are explicit fields so future tests do not depend on the CI runner's current clock.

### `rule-list-decisions.json`

References the committed `rule-list-formats.json` source fixture and records expected parser outputs and selected profiles for:

- plain AutoProxy host anchors;
- AutoProxy exclusive `@@` rules and priority;
- URL prefixes;
- regex rules;
- keyword rules;
- generic wildcard conversion;
- base64 AutoProxy preprocessing;
- SwitchyOmega explicit result profiles;
- `@note` attachment;
- explicit catch-all results;
- the observed leading-`!` plus `@with result` quirk;
- legacy Switchy wildcard and exclusive sections;
- legacy Switchy regexp sections.

Each vector carries the exact source line, expected condition type, expected normalized pattern, selected profile, and priority group.

## Support classification

Every vector is marked:

- `exact`: expected to remain behaviorally identical across the reference interpreter and supported backends; or
- `target-dependent`: source semantics are known, but browser capabilities can alter available request information.

Current target-dependent examples include:

- full HTTPS URL path matching;
- some URL wildcard/regex constructs;
- Unicode IDN representation.

A target-dependent vector is not skipped. It must produce a capability result explaining whether the target can execute it exactly, narrowly through a compatibility backend, or only with an explicit downgrade.

## Ordered-rule significance

The vector corpus records first-match behavior, not merely independent condition truth.

One deliberate compatibility trap is the SwitchyOmega source line:

```text
!*.excluded.example.invalid +direct
```

inside an `@with result` list. In the pinned parser, the leading `!` path does not parse the trailing result suffix normally. The earlier `*.example.invalid +fixed` rule therefore wins for an excluded subdomain. The vector records the observed result rather than the apparent user intent.

Nex may warn and repair this during migration, but it must not silently claim exact compatibility while changing the decision.

## Validation

`scripts/validate-decision-vectors.mjs` verifies:

- unique vector IDs across both files;
- complete condition-type coverage;
- explicit clock inputs for weekday and time conditions;
- valid support classifications;
- fixed/direct result consistency;
- source-line presence in the referenced rule-list fixture;
- base64 source preprocessing for lookup;
- recognized parsed condition types;
- required AutoProxy and Switchy parser-family coverage;
- required rule-list construct coverage.

This validator checks corpus completeness and internal consistency. It intentionally does not implement the matching engine. Executable semantic verification begins with the reference interpreter milestone.

## Change procedure

Changing an expected decision requires:

1. pinned source evidence or browser integration evidence;
2. a precise explanation in the PR;
3. updating the relevant vector;
4. updating compatibility classification when behavior becomes target-dependent or downgraded;
5. full CI validation.

Vectors must never be changed merely to make a new implementation pass.
