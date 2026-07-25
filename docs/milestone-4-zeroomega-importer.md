# Milestone 4 — ZeroOmega schema-v2 importer

Status: complete and verified on `feat/m4-zeroomega-importer`.

## Purpose

The importer converts ZeroOmega v3.5.0 `schemaVersion: 2` backups into an inactive ProfileSpec `1.0` candidate. It never applies browser proxy settings and never replaces the active configuration.

## Public result contract

A successful import returns:

- `activation: "inactive-candidate"`;
- a validated ProfileSpec candidate;
- a machine-readable migration report;
- secret materials separated from ordinary configuration;
- deterministic identifiers for identical input and import context.

A rejected import returns no candidate.

## Accepted input

- UTF-8 JSON object text;
- legacy base64-encoded JSON text;
- already parsed object input for trusted internal callers.

The decoder enforces byte, nesting-depth, object-node, profile-count, and rule-count limits before migration completes.

## Compatibility coverage

Profiles:

- FixedProfile;
- PacProfile;
- AutoDetectProfile;
- SwitchProfile;
- VirtualProfile;
- RuleListProfile;
- SwitchyRuleListProfile;
- AutoProxyRuleListProfile;
- DirectProfile and SystemProfile as built-in route aliases rather than user profiles.

Conditions:

- TrueCondition;
- FalseCondition;
- UrlRegexCondition;
- UrlWildcardCondition;
- HostRegexCondition;
- HostWildcardCondition;
- BypassCondition;
- KeywordCondition;
- IpCondition;
- HostLevelsCondition;
- WeekdayCondition;
- TimeCondition.

The importer preserves profile order, rule order, quick-switch order, annotations, colors, startup intent, proxy endpoints, bypass entries, rule-source metadata, PAC sources, and supported interface settings.

## Secret boundary

Proxy passwords and sensitive request-header values are removed from ProfileSpec and returned only through `secretMaterials` with opaque references. Proxy usernames remain ordinary endpoint metadata because they are required to reconstruct the endpoint identity.

The candidate and migration report are tested to exclude every extracted secret value.

## Generated and runtime data

Downloaded rule-list/PAC caches, hashes, timestamps, monitor state, synchronization runtime residue, and other reproducible or device-local state are not promoted into active ProfileSpec semantics. Their handling is recorded in the migration report.

## Activation safety

Before returning a successful candidate, the importer runs the ProfileSpec JSON Schema and semantic validator. Missing references, duplicate or reserved names, cycles, invalid endpoint data, unknown routing behavior, unsafe headers, unsupported profile types, and unsupported condition types block activation.

## Verification

The verified suite covers:

- ordinary JSON and full base64 backup pipelines;
- all pinned profile and condition families;
- credentials and sensitive headers;
- IDN, IPv4, IPv6, ports, and malformed bypass evidence;
- Switchy and AutoProxy rule-list formats;
- ten unsafe fixture classes;
- real unredacted secret extraction;
- deterministic candidate bytes and identifiers;
- a deterministic 36-profile, 1,024-rule scale fixture;
- strict TypeScript, ESLint, Prettier, Chromium MV3 and Firefox MV3 builds, manifest audits, and packaged artifacts.

Exact verified implementation Head: `fd989f7`  
GitHub Actions run: `30142477022`
