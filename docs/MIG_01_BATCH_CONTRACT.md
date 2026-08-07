# MIG-01 Batch Contract — Real Original-Export Golden Path

## 1. Parent journey

Real original migration and semantic round trip.

## 2. User outcome

A supported ZeroOmega v3.5.0 export can be imported into Nex and used immediately without rebuilding profiles, reinterpreting configuration, or completing a mandatory migration ritual.

## 3. Compatibility classes

- `CONTRACT-EXACT`: source data, profile identity, names, colors, order, references, startup, Quick Switch, endpoints, bypass, PAC, Rule Lists, temporary-rule meaning, supported authentication metadata, activation, route results, persistence, restart, semantic export, failure recovery, rollback, and security.
- `UX-COMPATIBLE`: the import entry point, file choice, successful completion, precise blocking errors, and immediate transition to the familiar usable configuration.
- `MODERNIZED`: bounded parsing, stable IDs, secret extraction, inactive candidate revisions, differential compilation, atomic activation, structured reports, and background-owned storage.
- `LEGACY-DEFECT-REJECTED`: plaintext secret export, silent field loss, partial activation, stale-cache substitution, unsafe local-file activation, and other confirmed legacy defects.

## 4. Included scope

- inventory and classify the existing importer, ProfileSpec mapping, storage, activation, export, and tests;
- establish provenance-bound real and official migration corpus;
- map every required schema-v2 field to preserved, exact, target-dependent, downgraded, unsupported, or rejected status;
- import and persist supported profiles and settings;
- preserve safe opaque metadata needed for semantic round trip;
- isolate authentication material behind secret references;
- activate the imported configuration atomically;
- verify representative real URL decisions on Chromium and Firefox;
- restart both browsers and restore the confirmed imported state;
- semantically export and compare the required user intent;
- inject parser, mapping, storage, compilation, installation, confirmation, restart, and export failures;
- migrate the historical audit rows relevant to this journey into the current compatibility classes.

## 5. Frozen scope

The following are excluded unless they become an irreducible blocker for this migration journey:

- Popup or Options beautification unrelated to import completion;
- new ordinary-user pages or migration taxonomy;
- broad diagnostics, scheduling, history, or backup expansion;
- Gist, WebDAV, browser-cloud, or other remote synchronization;
- new Profile families;
- speculative PAC optimization;
- Rust/WASM or native-engine work;
- unrelated Toolbar, site-rule, or visual micro-state work.

## 6. Required corpus

### Corpus A — official/default

An original v3.5.0 official or runtime-produced default export with provenance and expected defaults.

### Corpus B — owner representative

A sanitized export representative of the repository owner's daily configuration. Sanitization must preserve structure, profile families, references, ordering, colors, PAC/Rule List shape, startup, and Quick Switch while removing usable secrets and private endpoints where necessary.

### Corpus C — nested semantics

A real or original-runtime-produced export containing nested Switch, Virtual, attached Rule List, default-result, and reference behavior.

### Corpus D — PAC and operational metadata

A real or original-runtime-produced export covering PAC URL or body, update/cache state, bypass, proxy authentication metadata, Unicode, and safe unknown fields, plus provenance-bound original-runtime ingestion vectors for repeated name-bearing references where the original runtime defines deterministic normalization. Duplicate Profile identities are not positive corpus because the original public runtime rejects them.

### Negative corpus

Malformed encoding, invalid JSON, missing references, cycles, duplicate Profile identities, key/name-mismatched shadow definitions, oversized input, excessive nesting, unsupported fields, unsafe local `file:` PAC, unsupported SOCKS credentials, secret-like metadata, hostile resource cases, blocked import analysis after a known-good activation, and interrupted persisted Apply transactions across browser restart.

Synthetic fixtures may cover isolated boundaries but cannot substitute for Corpus A–D.

## 7. Hard acceptance criteria

1. The four positive corpus groups complete:

   `direct import -> inactive validation -> atomic activation -> real route decisions -> browser restart -> semantic re-export`

2. Required representable fields are preserved at 100%.
3. Silent loss, silent reinterpretation, and silent downgrade are zero.
4. Names, colors, order, references, startup profile, Quick Switch, supported PAC/Rule List/bypass behavior, and safe opaque metadata survive the round trip.
5. Chromium and Firefox produce the expected supported effective route decisions.
6. Every unsupported, target-dependent, downgraded, or rejected item has a precise machine-readable and user-actionable result.
7. Every injected failure leaves or restores the previous confirmed active configuration.
8. Import analysis does not mutate active state.
9. Successful ordinary import requires no manual profile reconstruction or mandatory migration wizard.
10. Export, logs, PAC, command responses, UI, and workflow artifacts contain no usable credentials or secret values.

## 8. Evidence plan

- original package/source/runtime provenance for each corpus item;
- explicit source-field to Nex representation matrix;
- deterministic importer and semantic vectors;
- reference-interpreter and PAC differential results;
- Chromium and Firefox packaged-extension journeys;
- restart and failure-injection results;
- semantic round-trip comparison that ignores only documented non-user runtime artifacts;
- secret scan across exported files, PAC, logs, artifacts, command responses, and rendered UI;
- one clean exact Head receives the permanent full gate set at batch completion.

## 9. Initial task sequence

1. `MIG-01.1` — inventory current importer, fixtures, mappings, storage transactions, activation, export, and known debt.
2. `MIG-01.2` — define corpus manifest, provenance, sanitization, secret scanning, and expected semantic anchors.
3. `MIG-01.3` — migrate relevant audit rows and build the source-field preservation matrix.
4. `MIG-01.4` — run Corpus A through the complete chain and fix the first blocking layer.
5. `MIG-01.5` — run Corpus B–D and close mapping, storage, activation, and browser gaps.
6. `MIG-01.6` — complete negative corpus and failure-injection recovery.
7. `MIG-01.7` — complete semantic export/re-import and secret-leak checks.
8. `MIG-01.8` — form one clean exact Head, run final gates, update progress/confidence/debt, and close the batch.

The sequence follows the first failing layer. It does not split each field or micro-state into a separate delivery batch.

### MIG-01.6 failure-preservation checkpoint

The repository-controlled MIG-01.6 matrix is maintained in
`docs/MIG_01_FAILURE_PRESERVATION_MATRIX.md`. Closure requires fail-closed evidence across parser,
mapping, storage/transaction, compilation/preflight, authentication, installation, confirmation,
restart, import-analysis, and export layers.

The restart contract treats durable workflow `pendingApply` as a real interrupted transaction rather
than a cosmetic busy flag. On startup, the previous `state.applied` configuration is authoritative;
the browser must be rolled back to it before `pendingApply` may be cleared. A successful recovery
preserves the user Draft for retry and records a failed Apply with `stage = recovery`. A failed
recovery remains `rollback-required` and must not be reported as success.

A blocking `.bak` selected after a known-good activation must expose no Import & Use action, must
leave the workflow storage namespace unchanged, and must leave the already confirmed browser route
usable. Chromium and Firefox permanent migration E2E carry this negative path together with the
interrupted-Apply restart path rather than adding a separate permanent workflow per failure class.

Closing MIG-01.6 does not satisfy Corpus B, does not close MIG-01, and does not change product
progress by itself.

### MIG-01.7 semantic export/re-import checkpoint

Cross-browser export equivalence is judged on a frozen canonical semantic projection, not raw JSON object-key insertion order. The projection is first asserted value-exact against the provenance-bound source fixture, then recursively canonicalized by sorting object keys while preserving array order before SHA-256. Raw bytes and raw SHA-256 remain diagnostics. Generated RuleList `pacScript` remains excluded as rebuildable generated state; original-compatible `revision` remains preserved and is not normalized merely for hash equality.

A/C/D/large ordinary exports must be accepted by review-only re-import without mutating the workflow storage namespace or changing the confirmed browser route. The package-level fixed point additionally requires `import -> export#1 -> re-import -> export#2` to stabilize byte-for-byte after sanitization.

The sensitive vector injects a unique password/header-value sentinel and requires it to remain absent from compatibility UI, workflow command responses, the profile-workflow storage namespace, ordinary export, sanitized re-import review, and permanent evidence. Ordinary export must not contain secret references or sensitive header metadata. SecretStore itself is not treated as a leak surface because it is the designated secret boundary.

MIG-01.7 uses the existing permanent Browser E2E workflow with one dependent consolidation job; it does not create a permanent workflow per corpus or field. Closing this checkpoint does not fabricate Corpus B, does not by itself close MIG-01, and does not change audited progress.

## 10. Stop rules

Stop and re-plan when:

- real data disproves the current ProfileSpec or importer architecture;
- a fix would require an unrelated second parent journey;
- a field or behavior cannot be classified under the four compatibility classes;
- the proposal silently drops or reinterprets source data;
- active state would be mutated before complete confirmation;
- a proposed UI solution exposes internal candidate, compiler, snapshot, graph, or capability taxonomy as mandatory workflow;
- evidence work no longer changes a migration, semantic, recovery, or security decision;
- two consecutive implementation cycles add no measurable acceptance progress.

## 11. Debt budget

- High-severity compatibility debt discovered in real corpus cannot be carried past `MIG-01` closure.
- High-severity storage, activation, data-loss, or secret-handling debt cannot be deferred.
- Target-limited behavior may remain only with precise status, evidence, user impact, and an accepted difference record.
- Process debt must decrease: no new independent permanent workflow per field or micro-state.
- Scope debt must remain zero: excluded features stay frozen.

## 12. Owner involvement

The owner is not asked to test intermediate importer slices.

Owner input is required only if:

- a representative sanitized export is not already available and cannot be safely reconstructed from repository evidence;
- real data exposes a material product-contract choice;
- the complete migration parent journey is ready for a consolidated future decision.

Release state remains `NO-GO` throughout `MIG-01`.
