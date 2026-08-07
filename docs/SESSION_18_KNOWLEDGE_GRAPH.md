# Session 18 Knowledge Graph — MIG-01.7 Semantic Export/Re-import + Secret-Leak Consolidation

## 1. Governing state

- Product WIP remains exactly one parent journey: `MIG-01` real original `.bak` export golden path.
- Popup/Options product work remains frozen; this checkpoint only uses the existing Options import/export surface as the migration transaction UI.
- Audited product completion remains `45.15%` (reported `45%`). Release remains `NO-GO`; owner retest remains prohibited until the parent journey is ready.
- Product baseline entering this session: `89785b631d435f760fe1ccdb0ebf20f4db8a39e7`, with all six permanent workflows green.

## 2. MIG-01.7 objective graph

`original/representative .bak`
→ import + compatibility review
→ acceptance / Apply
→ real route decisions
→ persistent restart
→ ordinary schema-v2 semantic export
→ review-only re-import
→ persistence nonmutation
→ canonical semantic projection equivalence across Chromium/Firefox
→ secret-leak consolidation across UI / command / workflow persistence / export / re-import.

MIG-01.7 does not reopen MIG-01.6 failure-preservation and does not fabricate Corpus B owner data.

## 3. Package-level semantic fixed point

Permanent package test: `packages/legacy-zeroomega/src/semantic-consolidation.test.ts`.

For Corpus A, original-runtime C/D, and the provenance-bound large representative vector:

`import → export#1 → re-import → export#2`

must stabilize such that `export#2.options === export#1.options` and `export#2.content === export#1.content`, with no secret materials created by the sanitized re-import.

The sensitive vector additionally requires:

1. first import extracts secret material from the source;
2. ordinary export reports secret omission and contains neither secret values nor secret references;
3. sanitized re-import contains zero secret material;
4. second ordinary export is byte-identical to the first sanitized export and has no further secret omission.

An earlier research assertion that required internal ProfileSpec candidate identity to remain byte/field identical was rejected as over-strict because document/revision identity is not the exported user-intent contract. The permanent invariant is the external schema-v2 fixed point above.

## 4. C/D cross-browser hash investigation

### 4.1 Initial research result

Corrected dual-browser research run `31168685926` proved both Chromium and Firefox semantic chains and both secret-leak sentinels. Consolidation failed only because C/D raw and ordinary `JSON.stringify` projection hashes differed although both exports were `3038` bytes and each browser independently deep-equaled its required C/D projection to the same original fixture.

Observed diagnostics:

- Chromium raw SHA-256: `f561ac894c800e1323e27e51d95e098142f0a38c041061dd0dedd2d151f9609a`
- Firefox raw SHA-256: `a0486603bd1548e4fea3482681ea41818502a9c5248637e1033ffdf56ba105f6`
- pre-canonical Chromium projection SHA-256: `f42381a8c45bdff2d8c0dc3569b58e1c7530fe0a39f7068eab4a0436f3288316`
- pre-canonical Firefox projection SHA-256: `fb2d662a8c61dc0a2f33cd865beb59a2ab396f4621b191f7bcdd1ee47a0feb07`

### 4.2 Component attribution — pass 1

Research run `31171352007`, consolidate job `92843793286`, SUCCESS.

Only the C/D `corpusRules` component differed. The following component hashes were identical across Chromium and Firefox:

- settings;
- `corpusProxy`;
- `innerSwitch`;
- `virtualRoute`;
- `outerSwitch`;
- Unicode PAC profile.

Research artifacts:

- Chromium artifact `8991095825`, SHA-256 `d042d84a8be8aea2f8e7b2b9331bb45fbc60a235331aec7bfab8e1cdeb647491`;
- Firefox artifact `8991092790`, SHA-256 `2765c1071d3099a8227f01c5ff4cc41581ccf6cc0b434279822ff4086d510db6`.

### 4.3 Component attribution — pass 2

Research run `31171743508`; Chromium job `92844858994` SUCCESS, Firefox job `92844859046` SUCCESS, consolidate job `92844996126` SUCCESS.

Within `corpusRules`, all of these hashes were identical:

- identity (`name`, `profileType`);
- `revision`;
- `color`;
- `defaultProfileName`;
- `matchProfileName`;
- `format`;
- `ruleList`;
- all other key names and all other values.

The sole differing sub-hash was the safe opaque metadata object `x-benign-metadata` when hashed with plain `JSON.stringify` property order.

Research artifacts:

- Chromium artifact `8991245049`, SHA-256 `a5d4cc236ec715bcb6251ec7d5cd883748e1590c07f7c651f64c05d2f2285964`;
- Firefox artifact `8991239502`, SHA-256 `366a9584464536db08a4ca93cd564a49b532031f9fa55c980dc11b084997e54d`.

Because both browser scripts already deep-equaled the complete required C/D projection to the same original fixture, the safe metadata values are equal; the remaining difference is JavaScript object insertion order, which is not a configuration semantic.

## 5. Original-runtime `revision` classification

Pinned original source remains `zero-peak/ZeroOmega@v3.5.0`, source commit `05cbb30a2204cc3bdf3bb2e65765a70644a022d7`.

Original `omega-pac/src/profiles.coffee` uses profile `revision` as the `AttachedCache` tag and can generate revisions through `Profiles.updateRevision`. Original `omega-target/src/options.coffee` compares revisions during revision-checked option updates. RuleList update separately changes `ruleList` and invalidates/rebuilds generated `pacScript`.

Decision: do **not** delete or normalize the exported `revision` compatibility field merely to obtain cross-browser byte equality. The component-hash proof also shows `revision` was not the C/D discrepancy.

## 6. Frozen semantic projection contract

Cross-browser equivalence is based on the explicit required user-intent projection already asserted against the provenance-bound source fixture, not on raw JSON object property order.

`semanticSha256(value)` now recursively sorts object keys before JSON serialization and hashing. Arrays retain order. Primitive values are unchanged.

Consequences:

- raw exported byte count and raw SHA-256 remain recorded diagnostics;
- raw hash equality is **not** a cross-browser acceptance condition;
- canonical semantic projection SHA-256 **is** a cross-browser acceptance condition;
- route/profile ordering represented by arrays remains exact;
- safe opaque JSON metadata remains value-exact while irrelevant object-key insertion order is ignored;
- generated RuleList `pacScript` remains excluded where the migration contract already treats it as rebuildable generated state.

This is an evidence projection only. It does not rewrite user data or alter ordinary `.bak` serialization.

## 7. Browser re-import and persistence contract

Chromium and Firefox original migration scripts now extend the existing real browser chain rather than creating a second migration implementation.

For A, C/D, and large vectors:

1. ordinary `.bak` is downloaded from the packaged extension;
2. required semantics are deep-equaled to the source fixture;
3. export is scanned for forbidden secret markers;
4. the exported `.bak` is selected again for compatibility review;
5. Import & Use must remain available;
6. review-only re-import must not mutate the profile-workflow storage namespace;
7. the previously confirmed browser route remains usable;
8. one compact evidence row records raw diagnostics, canonical semantic hash, accepted re-import, nonmutation, and clean secret scan.

## 8. Secret-leak consolidation contract

Dedicated Chromium and Firefox secret sentinels inject a random per-run value into password fields and sensitive Authorization/token header **values** of the redacted fixture. Usernames are intentionally not classified as secret values.

The sentinel must be absent from:

- rendered compatibility review;
- background `get` command response;
- profile-workflow storage namespace;
- ordinary `.bak` export;
- sanitized re-import review.

Ordinary export must additionally contain no `passwordSecretRef`, generic `secretRef`, Authorization header, or fixture token header metadata. Selecting the sanitized export for review must not mutate persistent workflow state.

SecretStore is not scanned as a "leak" surface merely because its purpose is to hold secret material; the acceptance condition is that secrets do not escape into user-visible, ordinary-export, workflow-state, command-response, or evidence/log surfaces.

## 9. Permanent gate design

The existing `Browser E2E` workflow remains the single permanent browser workflow. Chromium and Firefox jobs append exactly four MIG-01.7 evidence rows each:

- semantic A;
- semantic C/D;
- semantic large;
- sensitive secret-leak sentinel.

A dependent consolidation job downloads both evidence artifacts, validates schema and booleans, and requires canonical semantic hashes to match for A/C/D/large. Raw export hashes are retained and printed only as diagnostics when different.

No permanent workflow is added per field or per corpus child.

## 10. Current staging state and closure rule

Productization is being assembled on disposable branch `research/mig01-semantic-productize` from exact product baseline `89785b631d435f760fe1ccdb0ebf20f4db8a39e7`.

MIG-01.7 is not closed until:

1. staging verify/browser proof passes with the canonical projection;
2. product branch is fast-forwarded to the coherent implementation;
3. all six permanent workflows are green on the exact product Head;
4. this document is updated with those exact run/job/artifact IDs and the final Head.

## 11. Handoff after MIG-01.7

If the permanent exact-Head gates close MIG-01.7, the next parent step is `MIG-01.8`: form/confirm one clean batch Head, reconcile remaining external Corpus B/owner dependencies and audited journey closure, update confidence/debt/progress only from evidence, and keep release `NO-GO` until the parent batch acceptance is actually satisfied.
