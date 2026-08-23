# Session 15 Knowledge Graph - MIG-01.5 Corpus D Field Matrix

This file records the latest Session 15 project graph after safe unknown metadata and original-runtime
duplicate-name normalization. Stable product rules live in `PRODUCT_CONSTITUTION.md`; current
authorization and audited completion live in `PROJECT_STATE.json`. GitHub PR metadata and checks
remain authoritative for the moving exact Head.

## 1. Active product graph

```text
ZeroOmega Nex
  -> MIG-01 real original-export golden path [only product WIP]
    -> Corpus A [dual-browser packaged complete]
    -> Corpus B [external blocker: sanitized owner backup absent]
    -> Corpus C [original-runtime complex positive packaged complete]
    -> Corpus D [repository-controlled field matrix complete at this checkpoint]
      -> Unicode PAC / URL / body / cache-update shapes [complete evidence]
      -> proxy auth + sensitive/non-sensitive headers [complete evidence]
      -> safe unknown metadata [complete evidence]
      -> duplicate-name semantics [complete evidence]
         -> duplicate Profile identity [negative corpus; original public runtime rejects]
         -> repeated valid Quick Switch names [positive ingestion normalization; first wins]
    -> large original/representative export storage + restart capacity [next executable MIG-01.5]
    -> owner Firefox retest [external dependency; unauthorized]
```

Popup/Options refinement remains frozen. No second product batch is authorized.

## 2. Session-start state reconciliation

Session 15 began from product Head `565ec314b4266bb65e85dec11dd70af4d5a50bcf`.
Its CI `31148901093`, Browser E2E `31148901192`, Parity Documentation `31148901148`, Milestone 8
Visual Evidence `31148901109`, Original Nex UI Evidence `31148901108`, and Original Toolbar
Evidence `31148901194` were all rechecked as successful before duplicate-name work started.

The audited product completion remains `45.15%`, reported as `45%`; release remains `NO-GO` and
owner retest remains prohibited.

## 3. Safe unknown metadata checkpoint retained

The provenance-backed `x-benign-metadata` field on the real original-runtime Corpus C/D Rule List
survives original `Profiles.create -> update -> analyze -> compile -> JSON.stringify`, then Nex
import -> legacy namespace -> acceptance -> Apply -> export -> re-import. Risk-bearing unknown
metadata remains fail-closed. Research run `31148550308`, job `92773166550`, artifact `8982414439`,
and product checkpoint `565ec314b4266bb65e85dec11dd70af4d5a50bcf` remain the governing evidence.

## 4. Original-runtime duplicate-name source proof

The phrase "duplicate names where valid" was ambiguous and was resolved against the actual pinned
`zero-peak/ZeroOmega@v3.5.0` runtime, source commit
`05cbb30a2204cc3bdf3bb2e65765a70644a022d7`.

The first research run `31150283050` / job `92778294231` failed before semantic assertions because
`omega-pac` runtime dependencies were not installed. This is environment evidence only and is not a
product or compatibility failure.

After installing the original runtime dependencies, run `31150394682` / job `92778615225`
completed successfully and proved:

- `Options.addProfile()` rejects a second Profile named `duplicate target` with
  `Target name duplicate target already taken!`;
- `Options.renameProfile()` also rejects renaming onto an occupied name. Its observed
  `name is not defined` message is an original error-message defect, not permission to duplicate;
- a key/name-mismatched raw shadow definition can be iterated by key, but `Profiles.byName()` and
  reference closure resolve the canonical `+<name>` slot, making the shadow address-ambiguous;
- duplicate JSON object keys are already last-wins at `JSON.parse` before ZeroOmega sees the object;
- repeated valid Quick Switch names are deterministic positive ingestion input: the original runtime
  keeps the first occurrence and removes later repeats during Options initialization;
- the research vector
  `proxy, proxy, auto switch, proxy, system, system, missing profile, <empty>, auto switch`
  stabilized to `proxy, auto switch, system`;
- the stabilized original-runtime backup SHA-256 is
  `56e195d0318755ae77b3cfec294832a60f59e96f7e8ca233d91d51cb93ec4af1`.

Research artifact `8983062405` has ZIP SHA-256
`f9c6da1fb828da1a27743d7255761bb2e0fb1f3636d8e8a4c63669537624e9c8`.
Research source checkpoint is `28e638584517caf2477bd9a38d6c5ae5d3d5b588`.

## 5. Nex duplicate-name compatibility contract

Duplicate Profile identities remain rejected by the existing inventory checks
`profile.key-name-mismatch` / `profile.duplicate-name`; the original runtime evidence confirms this
is the correct negative-corpus behavior and must not be relaxed.

The public legacy import boundary now owns original-runtime normalization for repeated valid Quick
Switch names. A successful source with repeated names produces one route for the first occurrence,
omits later occurrences, and records each omission as
`settings.quick-switch-duplicate-normalized` with status `exact`.

The transaction evidence covers:

```text
legacy input with repeated valid Quick Switch names
  -> public import normalization
  -> inactive candidate with unique first-occurrence routes
  -> acceptance
  -> Apply / activation candidate
  -> schema-v2 .bak export with unique names
  -> re-import with no further normalization required
```

The original normalized backup and provenance are pinned under `fixtures/zeroomega-v2/`. The batch
contract now distinguishes deterministic duplicate name-bearing references from invalid duplicate
Profile identities rather than treating both as one positive Corpus D shape.

## 6. Gate reconciliation and permanent evidence

The first coherent implementation checkpoint was
`d6c7619b3a8163b2328f87fc02f631a8c42cf333` (`fix: match original duplicate-name normalization`).
Its first permanent CI run `31151027978` stopped at repository Prettier before TypeScript, tests, or
builds; only the three newly added TypeScript files required formatting. Parity Documentation run
`31151028129` passed canonical parity-content validation but then correctly blocked the commit because
a `packages/legacy-zeroomega/` change had not simultaneously synchronized
`docs/ORIGINAL_KNOWLEDGE_GRAPH.md` and `docs/UI_AUDIT_MATRIX.md`. Neither failure was a migration
behavior result.

A disposable gate-fix workflow then ran repository Prettier and synchronized those two canonical
documents. Run `31151266222` / job `92781227855` succeeded and produced product commit
`79a65ac6b83f0d14fcb95e464e9a06477a771fc7` (`test: close duplicate-name evidence gates`). The
canonical knowledge graph now records original public-runtime duplicate Profile rejection and
Quick Switch first-occurrence normalization; UI audit row G-02 records the same migration evidence
without changing UI status or project progress.

Because `79a65ac6b83f0d14fcb95e464e9a06477a771fc7` was pushed by `github-actions[bot]`, its six PR
workflow records completed as `action_required` without jobs. They are trigger-layer artifacts, not
pass/fail evidence. Normal repository commit `d7319d0e94f9a7ff24c78a7735f47244457cd741` then restored
the ordinary PR event path and received the full permanent gate set:

- CI `31151464776`: success; verify/test/build/manifest/CSP/package completed, artifact
  `8983467676`, ZIP SHA-256 `9046738bb94ce575517b209c8f446ae8407a8a0631d76788fcd145afbcad87fd`;
- Browser E2E `31151465183`: success;
  - Chromium job `92781819117`: success, including original Corpus A and C/D import -> route ->
    restart -> semantic export; diagnostics artifact `8983474193`, ZIP SHA-256
    `b3d74fa5951769aa91f6d088cc97f8e00cb8142cf665ce4e046b49095529c75b`;
  - Firefox job `92781819116`: success on Firefox 152.0.6 with
    `geckodriverSystemAccess=false`, including original Corpus A and C/D import -> route -> restart ->
    semantic export, Toolbar/restart/Rule List/profile-trace/external-control/renderer fallback;
    diagnostics artifact `8983499186`, ZIP SHA-256
    `0edd549ac8b177c2a010423174178bc89081363320518f6eea47f9f5aff1f1db`;
  - Firefox policy-owned-popup and Chromium native-inspect jobs: success;
- Parity Documentation `31151464770`: success;
- Milestone 8 Visual Evidence `31151464786`: success;
- Original Nex UI Evidence `31151464779`: success;
- Original Toolbar Evidence `31151464801`: success.

This closes the valid duplicate-name semantics milestone and the repository-controlled Corpus D
field-class matrix named by the current batch contract. It does not close `MIG-01`, supply Corpus B,
or authorize owner retest/release.

## 7. State and next handoff

The repository-controlled Corpus D field classes named by the batch contract are now covered:
PAC/Unicode/cache-update shapes, authentication/headers, safe unknown metadata, and
original-runtime duplicate-name semantics. Corpus B remains externally blocked; larger
representative export/storage/restart capacity remains unproven; the packaged negative and
failure-preservation matrix remains for later MIG-01 work.

The next highest-value repository-controlled `MIG-01.5` target is a provenance-bound large
original/representative export capacity vector through import -> acceptance -> Apply -> persistent
restart -> semantic export/re-import on both browser targets. It must measure storage and restart
capacity without fabricating Corpus B owner data. After that, proceed to the remaining
parser/mapping/storage/compile/install/confirm/restart/export failure matrix under the existing
MIG-01 sequence.
