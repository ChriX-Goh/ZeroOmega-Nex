# Session 15 Knowledge Graph - MIG-01.5 Safe Unknown Metadata

This file records the Session 15 project graph at the safe-unknown-metadata checkpoint. Stable
product rules live in `PRODUCT_CONSTITUTION.md`; current authorization and audited completion live
in `PROJECT_STATE.json`. GitHub PR metadata and checks remain authoritative for the moving exact
Head.

## 1. Active product graph

```text
ZeroOmega Nex
  -> MIG-01 real original-export golden path [only product WIP]
    -> Corpus A [dual-browser packaged complete]
    -> Corpus B [external blocker: sanitized owner backup absent]
    -> Corpus C [original-runtime complex positive packaged complete]
    -> Corpus D [partial]
      -> Unicode PAC / URL / body [complete evidence]
      -> proxy auth + sensitive/non-sensitive headers [complete evidence]
      -> safe unknown metadata [this checkpoint]
      -> valid duplicate names [next executable matrix]
    -> owner Firefox retest [external dependency; unauthorized]
```

Popup/Options refinement remains frozen. No second product batch is authorized.

## 2. Session-start state reconciliation

The Session 14 clean Head is `47e936b96aaba0c2cb3852d53a1e8dc53a8a25b5`.
CI run `31147358627` completed successfully. Browser E2E run `31147361570` first failed before the
migration assertions because Firefox 152.0.6 did not expose its Marionette port. Re-running only the
failed Firefox job produced attempt 2 with all four Browser E2E jobs successful. The transient
Firefox startup failure is runner evidence, not a migration/product regression.

This closes the pending clean-Head gate from Session 14 without changing product completion.

## 3. Safe unknown metadata source proof

The existing importer already classifies JSON-compatible unknown profile fields as safely opaque
only when neither field names nor nested values touch risk-bearing semantics. Safe fields live under
`profile.legacy.fields`; unknown fields associated with secrets/auth/scripts/code/permissions/
network/proxy/conditions/rules/headers/hosts/ports/URLs fail closed.

The missing evidence was therefore upstream provenance and the complete migration chain, not a new
production workaround.

A disposable research branch generated the complex fixture from the actual pinned
`zero-peak/ZeroOmega@v3.5.0` runtime, source commit
`05cbb30a2204cc3bdf3bb2e65765a70644a022d7`. The benign field
`x-benign-metadata` on `+corpus rules` contains nested object/array/Unicode/scalar data. Original
runtime assertions prove exact retention through:

```text
Profiles.create
  -> Profiles.update
  -> Profiles.analyze
  -> Profiles.compile
  -> pre-export options
  -> JSON.stringify export
```

Research evidence:

- run `31148550308`: success;
- job `92773166550`: success;
- artifact `8982414439`;
- artifact ZIP SHA-256 `047a6fd9d2d8e1d25d8e996115c591ce75d9d2bc6d8fa0b86b64e7e42c0c5a45`;
- generated `.bak` SHA-256 `f0190ba86c95767b97f6eccdf76d9bd10a80bcdaecddfaa35f7708f9190ae092`;
- research commit `5de3c6d09c9b0c7198de07ed714126d161b2c6de`.

## 4. Nex acceptance contract at this checkpoint

`apps/extension/src/lib/original-complex-migration.test.ts` binds the provenance-backed field to the
Nex namespace and full transaction:

```text
original-runtime .bak
  -> import
  -> profile.legacy.fields["x-benign-metadata"]
  -> acceptance
  -> Apply / activation candidate
  -> schema-v2 .bak export
  -> re-import
  -> identical namespaced metadata and user intent
```

The same test mutates the real original-runtime corpus with `x-auth-token` and requires
`field.unknown-behavior` rejection. This prevents a broad "preserve every unknown field" rule from
weakening the security boundary.

The packaged Chromium and Firefox original-migration scripts already compare the complete
`+corpus rules` semantic object, excluding only generated `pacScript`; therefore adding the
provenance-backed field to the fixture makes both browser journeys fail if import/accept/Apply/
restart/export loses the metadata. No browser-test-only product state mutation is needed.

## 5. State and next handoff

Audited product completion remains `45.15%`, reported as `45%`; release remains `NO-GO` and owner
retest remains prohibited. This checkpoint strengthens Corpus D evidence but does not close Corpus
D or `MIG-01`.

Next repository-controlled work stays in `MIG-01.5`: prove and close valid duplicate-name behavior
against the original runtime, then continue the remaining Corpus D/failure matrix. Corpus B stays
explicitly externally blocked rather than being fabricated.
