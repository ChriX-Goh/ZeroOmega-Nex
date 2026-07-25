from pathlib import Path


def patch(path_string: str, replacements: list[tuple[str, str, str]]) -> None:
    path = Path(path_string)
    text = path.read_text()
    for old, new, label in replacements:
        count = text.count(old)
        if count != 1:
            raise SystemExit(f'{path_string} {label}: expected one anchor, found {count}')
        text = text.replace(old, new, 1)
    path.write_text(text)


patch(
    'packages/profile-workflow/src/contracts.ts',
    [
        (
            '''  readonly verification: {
    readonly passed: true;
    readonly vectorCount: number;''',
            '''  readonly verification: {
    readonly passed: true;
    readonly mode?: 'differential' | 'reference-safety';
    readonly vectorCount: number;''',
            'snapshot verification mode contract',
        )
    ],
)

patch(
    'apps/extension/src/entrypoints/options/App.svelte',
    [
        (
            '''  <main class="editor">
    {#if loading}''',
            '''  <main class="editor">
    {#if errorMessage}
      <section class="settings-section global-error" aria-live="assertive">
        <h2>Operation failed</h2>
        <p role="alert">{errorMessage}</p>
      </section>
    {/if}

    {#if loading}''',
            'global Options error surface',
        ),
        (
            '''        {#if errorMessage}
          <p role="alert">{errorMessage}</p>
        {:else if view?.busy}
          <p>Apply is in progress: {state?.pendingApply?.phase ?? 'preparing'}.</p>
        {:else}''',
            '''        {#if view?.busy}
          <p>Apply is in progress: {state?.pendingApply?.phase ?? 'preparing'}.</p>
        {:else}''',
            'remove duplicate working-copy error',
        ),
    ],
)

patch(
    'apps/extension/src/entrypoints/options/SnapshotHistoryPanel.svelte',
    [
        (
            '''  function hasRevision(entry: ProfileWorkflowSnapshotHistoryEntry): boolean {
    return revisions.some((revision) => revision.revisionId === entry.sourceRevisionId);
  }
''',
            '''  function hasRevision(entry: ProfileWorkflowSnapshotHistoryEntry): boolean {
    return revisions.some((revision) => revision.revisionId === entry.sourceRevisionId);
  }

  function verificationModeLabel(entry: ProfileWorkflowSnapshotHistoryEntry): string {
    if (entry.verification.mode === 'differential') return 'Node differential execution';
    if (entry.verification.mode === 'reference-safety') {
      return 'Extension reference-safety check plus browser install confirmation';
    }
    return 'Legacy verification record';
  }
''',
            'verification mode label helper',
        ),
        (
            '''        <div>
          <dt>Verification</dt>
          <dd>
            {entry.verification.matchedCount}/{entry.verification.vectorCount} vectors matched
          </dd>
        </div>''',
            '''        <div>
          <dt>Verification mode</dt>
          <dd>{verificationModeLabel(entry)}</dd>
        </div>
        <div>
          <dt>Verification vectors</dt>
          <dd>
            {entry.verification.matchedCount}/{entry.verification.vectorCount} vectors matched
          </dd>
        </div>''',
            'verification mode history display',
        ),
    ],
)

patch(
    'scripts/validate-ui-compatibility.mjs',
    [
        (
            '''  [
    snapshotHistory.includes('Confirm rollback'),
    'Snapshot rollback must require an explicit second confirmation action.',
  ],''',
            '''  [
    snapshotHistory.includes('Confirm rollback'),
    'Snapshot rollback must require an explicit second confirmation action.',
  ],
  [
    optionsApp.includes('class="settings-section global-error"'),
    'Options must surface background errors independently of the selected section.',
  ],
  [
    snapshotHistory.includes('Extension reference-safety check plus browser install confirmation'),
    'Snapshot history must disclose browser-safe runtime verification mode.',
  ],''',
            'history honesty UI guards',
        )
    ],
)

patch(
    'packages/browser-adapters/src/snapshot-history.test.ts',
    [
        (
            '''    warnings: [],
    verification: { passed: true, vectorCount: 3, matchedCount: 3 },
    ...overrides,''',
            '''    warnings: [],
    verification: {
      passed: true,
      mode: 'reference-safety',
      vectorCount: 3,
      matchedCount: 3,
    },
    ...overrides,''',
            'snapshot history verification mode fixture',
        ),
        (
            '''      compilerVersion: '0.1.0',
      verification: { passed: true, vectorCount: 3, matchedCount: 3 },
    });''',
            '''      compilerVersion: '0.1.0',
      verification: {
        passed: true,
        mode: 'reference-safety',
        vectorCount: 3,
        matchedCount: 3,
      },
    });''',
            'snapshot history mode expectation',
        ),
    ],
)
