# Profile Workflow

This package owns the editable ProfileSpec working copy used by the Options and popup interfaces.

The persisted state distinguishes:

- `applied`: the ProfileSpec revision confirmed by the browser activation layer.
- `draft`: the editable working copy. It intentionally retains the applied revision ID until Apply creates a real child revision.
- `pendingApply`: the candidate revision and transaction identity currently crossing the browser activation boundary.
- `lastApply`: the final success or failure record shown by the UI.

Dirty state is derived from canonical ProfileSpec content rather than mutable UI flags. Revert replaces the draft with the applied revision without changing browser proxy state.

Apply uses a single-writer compare-and-swap transaction:

1. Validate the draft and create a child ProfileSpec revision.
2. Persist the pending candidate.
3. Activate and confirm the candidate through the browser adapter.
4. Commit the candidate as applied and reset the draft only after activation succeeds.
5. Roll the browser back to the previous applied revision if the persistent commit fails.
6. Persist `rollback-required` if both commit and rollback fail.

The browser-storage repository is deliberately a single-writer primitive. Options and popup components do not mutate it directly; the extension background will serialize workflow commands through a typed message boundary in the next slice.
