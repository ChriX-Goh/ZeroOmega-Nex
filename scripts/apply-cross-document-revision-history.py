from pathlib import Path


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")


source = Path("packages/profile-workflow/src/revision-history.ts")
replace_once(
    source,
    """  const revisions = await repository.listRevisions();
  const ids = new Set<string>();""",
    """  const revisions = (await repository.listRevisions()).filter(
    (spec) => spec.documentId === state.applied.documentId,
  );
  const ids = new Set<string>();""",
    "revision document isolation",
)

test = Path("packages/profile-workflow/src/revision-history.test.ts")
replace_once(
    test,
    """  it('rejects revisions from another document', async () => {
    const state = createProfileWorkflowState(workflowFixture());
    const foreign = revision('revision-foreign', '2026-07-25T16:20:00.000Z');
    foreign.documentId = 'document-foreign';

    await expect(listProfileWorkflowRevisionHistory(repository([foreign]), state)).rejects.toThrow(
      'belongs to document document-foreign',
    );
  });""",
    """  it('isolates the current document while retaining foreign revision archives', async () => {
    const current = revision('revision-current', '2026-07-25T17:20:00.000Z');
    const state = createProfileWorkflowState(current);
    const foreign = revision(
      'revision-foreign',
      '2026-07-25T16:20:00.000Z',
      'revision-foreign',
    );
    foreign.documentId = 'document-foreign';

    await expect(
      listProfileWorkflowRevisionHistory(repository([foreign, current]), state),
    ).resolves.toEqual([
      {
        documentId: current.documentId,
        revisionId: 'revision-current',
        createdAt: '2026-07-25T17:20:00.000Z',
        profileCount: 2,
        endpointCount: 2,
        ruleSourceCount: 0,
        applied: true,
      },
    ]);
  });""",
    "cross-document revision history test",
)
