# Session 16 Knowledge Graph - MIG-01.5 Large Original Export Capacity

This graph continues the single authorized product WIP, `MIG-01` real original-export migration. It
starts from the valid duplicate-name evidence Head
`ca0cb68e4b691cede06d1c91da180098f5d81f78`. Product completion remains exactly `45.15%`
(reported `45%`), release remains `NO-GO`, PR #11 remains Draft, and owner retest remains
unauthorized. Popup/Options refinement stays frozen.

## 1. Active graph

```text
ZeroOmega Nex
  -> MIG-01 real original-export golden path [only product WIP]
    -> Corpus A [dual-browser packaged complete]
    -> Corpus B [external blocker: sanitized owner backup absent]
    -> Corpus C [original-runtime complex positive packaged complete]
    -> Corpus D repository-controlled field matrix [complete]
    -> large original/representative persistent-capacity evidence [complete]
       -> deterministic scale seed [36 profiles / 1,024 Switch rules / 1,024 Rule List entries]
       -> original v3.5.0 runtime stabilization [provenance-bound]
       -> real browser storage acceptance
       -> real Apply / PAC activation
       -> direct + proxied route decisions
       -> full browser restart using same persistent profile
       -> semantic .bak export
       -> semantic re-import analysis with zero persistent-state mutation
    -> MIG-01.6 negative/failure-preservation matrix [next repository-controlled target]
```

## 2. Session-start reconciliation

The exact product branch Head was rechecked as
`ca0cb68e4b691cede06d1c91da180098f5d81f78`. Its six permanent workflows remained successful:
CI `31151704524`, Browser E2E `31151704527`, Parity Documentation `31151704523`, Milestone 8
Visual Evidence `31151704519`, Original Nex UI Evidence `31151704528`, and Original Toolbar
Evidence `31151704518`.

The previous duplicate-name milestone remains unchanged: original public profile identities are
unique; repeated valid Quick Switch names normalize first occurrence only.

## 3. Capacity limits and storage boundary

The current legacy decoder bounds input at 16 MiB, 10,000 profiles, 200,000 rules, and 500,000 JSON
nodes. The capacity milestone does not claim those parser ceilings as browser-persistence guarantees.
It exercises the real browser repository namespace `zeroomega-nex/profile-workflow/v1`, including
full workflow state, revision index, and immutable revision records, then destroys and recreates the
browser process around the same user profile.

The pre-existing deterministic `large-representative.json` remains a scale/structure seed only. It
is not Corpus B and cannot substitute for owner representative data.

## 4. First original-runtime scale vector and discovered boundary

The scale seed was first passed through actual `zero-peak/ZeroOmega@v3.5.0`, source commit
`05cbb30a2204cc3bdf3bb2e65765a70644a022d7`, using
`Options.initWithOptions -> Options.getAll -> JSON.stringify` to match original export
serialization. The resulting large backup retained all 36 profiles, 1,024 Switch rules, and 1,024
Rule List entries.

The public Nex importer accepted this vector in about 78 ms and produced a 287,553-byte candidate.
Memory acceptance and fake Apply also succeeded. A real Chromium background transaction then proved
that `browser.storage.local` acceptance succeeded in about 385 ms for all 36 profiles, while real
Apply correctly failed in about 575 ms with `condition.url-wildcard-target-dependent`.

That failure came from 64 `UrlWildcardCondition` entries already present in the old scale seed. It
was not a capacity, storage, or restart failure. The compatibility decision is unchanged: do not
weaken the PAC compiler and do not relabel URL wildcard semantics as exact merely to make a capacity
vector activate.

Diagnostic evidence:

- memory transaction run `31154743155`, job `92791695421`;
- real Chromium transaction run `31155032522`, job `92792564443`;
- real storage `accept-import`: success, ~385.124 ms;
- real Apply: `apply-failed`, code `condition.url-wildcard-target-dependent`.

## 5. Activation-safe original-runtime capacity vector

To isolate capacity from the separately classified URL-wildcard boundary, exactly 64 seed
`UrlWildcardCondition` entries were deterministically replaced with exact `HostWildcardCondition`
capacity entries before original runtime stabilization. No profile, Switch rule, Rule List entry,
startup setting, Quick Switch entry, or scale dimension was removed.

The transformed seed was then passed through the real v3.5.0 runtime. The committed stable backup:

- file: `fixtures/zeroomega-v2/original-large-representative-v3.5.0.bak`;
- size: 222,565 bytes;
- SHA-256: `e0aacb5a7b1173942ddb8880036e0dc67bebacea454d35b6f70d587beffc4d51`;
- 36 profiles = 24 Fixed + 8 Switch + 4 Rule List;
- 1,024 Switch rules;
- 1,024 Rule List entries;
- zero `UrlWildcardCondition` entries;
- startup profile `switch-00`;
- Quick Switch: `switch-00`, `switch-01`, `rules-00`, `rules-01`, `proxy-00`, `proxy-01`, `direct`.

Generation run `31155231147` produced artifact `8984876512`, digest
`sha256:92bdba7d11138528dc230a9496c0b7b95fa93312b3315b7ac5db0d8e8fb2de33`.
The provenance file explicitly states that this vector is repository-controlled capacity evidence,
not Corpus B and not a compatibility reclassification.

## 6. Final dual-browser research proof

Final research run `31156296235` succeeded on both browser jobs:

- Chromium job `92796402453`: SUCCESS;
- Firefox job `92796402550`: SUCCESS, Firefox 152.0.6 with
  `geckodriverSystemAccess=false`.

Both browsers executed the same exact backup through:

```text
real Options import
  -> compatibility analysis
  -> acceptance
  -> Apply / real PAC activation
  -> direct + proxied route decisions
  -> full browser shutdown
  -> same persistent profile restart
  -> restored applied state + restored PAC route
  -> route decisions after restart
  -> semantic .bak export
  -> exported .bak re-import analysis
  -> route decisions after re-import analysis
```

The semantic export was identical on both browsers: 222,809 bytes, SHA-256
`30d54fc83cbd799aeb2b10c6b5588ba56ab774a4e8f2a84820e358cefcfb04fd`.

### Chromium persistence evidence

- after first Import & Use: workflow namespace 864,838 bytes, state 575,322 bytes, 4 keys,
  2 immutable revisions, generation 4;
- after full restart: exact same 864,838 / 575,322 / 4 / 2 / generation 4 and same applied revision;
- after semantic export, before re-import analysis: 866,124 bytes, state 576,608 bytes,
  2 revisions, generation 8, same applied revision;
- after re-import analysis: exact same metrics as immediately before re-import analysis.

The Chromium background generated unrelated runtime state between restart and export, so the
re-import mutation check intentionally uses an immediate post-export baseline. Re-import analysis
itself added zero persistent mutation.

### Firefox persistence evidence

- after first Import & Use: workflow namespace 864,830 bytes, state 575,318 bytes, 4 keys,
  2 immutable revisions, generation 4;
- after full restart: exact same metrics and same applied revision;
- after semantic export, before re-import analysis: exact same metrics;
- after re-import analysis: exact same metrics.

## 7. Productization contract

Only the proven stable backup, provenance, two large E2E scripts, permanent package-script wiring,
and documentation belong on the product branch. Research workflows, direct command probes,
temporary candidate snapshots, and patch helpers are disposable evidence infrastructure and must not
land in product.

The permanent Browser E2E entrypoints append the large capacity chain after existing Corpus A and
Corpus C/D journeys for both Chromium and Firefox. This adds no Popup/Options product refinement;
the existing import/export surface is used only as the real migration entrypoint under test.

## 8. Product checkpoint and permanent gates

Product commit `cb777978c7ca98efba92795c7b310cd2f464ca5e`
(`test: prove large original persistent migration`) was formed directly on
`feat/m8-profile-workflow` from the previously green duplicate-name Head. The research branch was
not merged. The product commit contains only the stable `.bak`, provenance, two final browser E2E
scripts, permanent package-script wiring, fixture documentation, and this Session 16 graph.

All six permanent workflows on that exact product commit completed SUCCESS:

- CI `31156746456`: SUCCESS; browser-build artifact `8985450502`, digest
  `sha256:4f8edf744304c16a38172f38a32a8be3408c1bf9b44f3fd35a90048e73581118`;
- Browser E2E `31156746427`: SUCCESS;
  - Chromium job `92797787580`: SUCCESS, including existing Corpus A/C/D plus the new large
    persistent migration chain; diagnostics artifact `8985460221`, digest
    `sha256:e89e0b472fd6885c2a7aa62e6304bc9835e217260cfc7d1db846bc8c8889fbb2`;
  - Firefox job `92797787636`: SUCCESS, including existing Corpus A/C/D plus the new large
    persistent migration chain; diagnostics artifact `8985502582`, digest
    `sha256:7bf1c0fd1f50219e49ba82f198558e1d9f658969c18694cba2fecfbd79a12b72`;
  - Firefox policy-owned-popup and Chromium native-inspect jobs: SUCCESS;
- Parity Documentation `31156746529`: SUCCESS;
- Milestone 8 Visual Evidence `31156746458`: SUCCESS;
- Original Nex UI Evidence `31156746399`: SUCCESS;
- Original Toolbar Evidence `31156746428`: SUCCESS.

This permanently wires the large capacity journey into both browser E2E entrypoints, so later
product changes continue to exercise it automatically.

## 9. Status and next handoff

The repository-controlled large original/representative `.bak` storage + persistent-restart
capacity milestone is closed. It proves the chosen 222,565-byte original-runtime vector survives
real import, acceptance, Apply, PAC activation, route decisions, approximately 865 KB of workflow
browser storage, complete browser restart, semantic export, and state-preserving semantic re-import
analysis on both Chromium and Firefox.

This is not a claim that every configuration up to the parser's 16 MiB ceiling fits browser
persistence; it is a provenance-bound representative capacity checkpoint at the current migration
scale. It does not close `MIG-01`, does not supply Corpus B, does not authorize owner retest, and
does not change the audited project percentage: `45.15%`, reported `45%`, release `NO-GO`.

The next highest-value repository-controlled task is `MIG-01.6`: complete the negative corpus and
failure-preservation matrix across parser, mapping, storage, compilation, installation,
confirmation, restart, and export failure layers while proving the previous confirmed active
configuration survives or is restored. Corpus B remains the external owner-data blocker.
