# MIG-01.7 Semantic Round-trip and Secret Surface Matrix

Status: repository-controlled `MIG-01.7` evidence closed at code/evidence Head `83451c1b313057e45fb954a47fc5fb08bb9268c6`; `MIG-01` remains open because Corpus B is absent.

This matrix does not satisfy Corpus B and does not change release state. It consolidates already
proven browser semantic-export evidence with permanent re-import idempotence and secret-surface
gates. Popup/Options refinement remains frozen.

## 1. Positive semantic round-trip

| Path                                  | Import + ordinary export | Re-import | Re-export idempotence          | Browser evidence                                    |
| ------------------------------------- | ------------------------ | --------- | ------------------------------ | --------------------------------------------------- |
| Corpus A original default             | required                 | required  | byte-stable after first export | Chromium + Firefox permanent original-migration E2E |
| Corpus C/D original complex           | required                 | required  | byte-stable after first export | Chromium + Firefox permanent original-migration E2E |
| Large original-runtime representative | required                 | required  | byte-stable after first export | Chromium + Firefox permanent large-migration E2E    |

`packages/legacy-zeroomega/src/semantic-roundtrip.test.ts` executes every repository-controlled row
above through `import -> export -> re-import -> re-export -> re-import -> re-export`. The first
ordinary export is the normalized semantic boundary; both subsequent exports must be byte-identical
to it. Import contexts deliberately use different document/revision timestamps so runtime revision
metadata cannot masquerade as user-visible backup semantics.

The browser jobs remain the authority for actual packaged-extension import, activation, route
results, restart, and UI-triggered semantic export. Both browser implementations compare their
exported required semantics with the same provenance-bound source. The large path additionally
records the exact exported byte count and SHA-256 in diagnostics.

## 2. Secret surface boundary

The original v3.5.0 backup format may contain plaintext auth and sensitive request headers. Nex must
accept those values only long enough to extract them into SecretStore. Ordinary public surfaces must
not carry the raw values afterward.

| Surface                                 | Required invariant                                    | Permanent evidence                              |
| --------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| migration report / review model         | no raw secret value                                   | `legacy-sensitive-public-surface.test.ts`       |
| inactive ProfileSpec candidate          | secret references only                                | same test + existing sensitive transaction test |
| accept-import command result            | no raw secret value                                   | `legacy-sensitive-public-surface.test.ts`       |
| Apply command result                    | no raw secret value                                   | same test                                       |
| workflow repository artifact            | no raw secret value                                   | same test                                       |
| activation / PAC compiler input         | no raw secret value                                   | same test                                       |
| compiled PAC artifact                   | no raw secret value or secret reference serialization | same test + PAC compiler secret test            |
| ordinary `.bak` export                  | omit credentials and sensitive headers entirely       | same test + legacy exporter tests               |
| sanitized `.bak` re-import              | zero secret materials                                 | same test                                       |
| sanitized re-export                     | byte-identical to first sanitized export              | same test                                       |
| rendered browser UI                     | no raw secret value                                   | Chromium + Firefox sensitive migration E2E      |
| Actions logs / uploaded diagnostics ZIP | no raw secret value                                   | downstream `migration-secret-leak-gate`         |

The raw-value assertions deliberately exclude SecretStore itself: SecretStore is the protected sink
that is expected to retain the secret. A passing test therefore proves confinement, not deletion.

## 3. Closure boundary

`MIG-01.7A` is complete only when the consolidated tests pass on the exact product Head together
with the existing permanent Browser E2E. It does not close `MIG-01.7`.

`MIG-01.7B` injects three controlled fake sentinels only into original password and sensitive
request-header values at runtime. Chromium and Firefox must prove the real Options import review,
post-import rendered UI, workflow command response, public proxy/PAC setting, and ordinary `.bak`
export contain none of them. A downstream permanent job downloads both browser diagnostics and
reads the same run’s Chromium/Firefox Actions job logs, then scans every surface again. The gate
reports only sentinel ordinals, never raw values. No new product UI or per-field workflow is
authorized. `MIG-01.7B` closes only after this exact-head Browser E2E chain passes.

## 4. Closure evidence

`MIG-01.7A` remains closed at `c0b23ee765db8b50d86fc8fa61ba105cd7c2a830`.

`MIG-01.7B` closed at code/evidence Head `83451c1b313057e45fb954a47fc5fb08bb9268c6` after the final cleaned branch passed all
six permanent workflows:

- CI `31185198202`: SUCCESS;
- Browser E2E `31185199106`: SUCCESS;
- Parity Documentation `31185196419`: SUCCESS;
- Milestone 8 Visual Evidence `31185196254`: SUCCESS;
- Original Nex UI Evidence `31185200569`: SUCCESS;
- Original Toolbar Evidence `31185201981`: SUCCESS.

Browser E2E jobs were Chromium `92887883714` SUCCESS and Firefox `92887883688` SUCCESS. Both
packaged browsers passed their runtime-only sensitive original-migration gate. Downstream
`migration-secret-leak-gate` job `92888843896` also SUCCESS and reported that the controlled
sentinels were absent across 15 diagnostics files and both browser job logs. Diagnostics artifacts:

- Chromium `8996480031`, SHA-256 `6c06fa9399ac1fb0cef55bdf2693290eb790ee45f2f749db7d1cd1f1155dc8d5`;
- Firefox `8996523043`, SHA-256 `fbbc00652e10d9879652fabe8f0193b0e77d3bdec85899239645b0b76ca04fd9`.

A Firefox large-migration teardown defect discovered during exact-head closure was corrected without
relaxing migration assertions: repeated `driver.quit()` now treats only an already-ended WebDriver
session as idempotent cleanup, while every other teardown error still fails. This removed a
`NoSuchSessionError` cleanup false negative and passes the full lint/build/browser gate set.

The repository-controlled scope of `MIG-01.7` is therefore closed. This does **not** close `MIG-01`:
Corpus B is still the required external owner representative backup and must not be fabricated. The
next sequence position is `MIG-01.8`, but batch-final closure is blocked until Corpus B can complete
the A-D acceptance set. Product completion remains `45.15%` (reported `45%`), owner retest remains
prohibited, PR #11 remains Draft, and release remains `NO-GO`.
