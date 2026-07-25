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
            '''export interface ProfileWorkflowState {''',
            '''export interface ProfileWorkflowRevisionHistoryEntry {
  readonly documentId: string;
  readonly revisionId: string;
  readonly parentRevisionId?: string;
  readonly createdAt: string;
  readonly deviceId?: string;
  readonly profileCount: number;
  readonly endpointCount: number;
  readonly ruleSourceCount: number;
  readonly applied: boolean;
}

export interface ProfileWorkflowState {''',
            'revision history entry contract',
        ),
        (
            '''export interface ProfileWorkflowActivationResult {''',
            '''export interface ProfileWorkflowRevisionRepository {
  getRevision(revisionId: string): Promise<ProfileSpec | undefined>;
  listRevisions(): Promise<readonly ProfileSpec[]>;
}

export interface ProfileWorkflowActivationResult {''',
            'revision repository contract',
        ),
    ],
)

patch(
    'packages/profile-workflow/src/index.ts',
    [
        (
            '  type ProfileWorkflowRepository,\n  type ProfileWorkflowRuntimeFailure,',
            '  type ProfileWorkflowRepository,\n  type ProfileWorkflowRevisionHistoryEntry,\n  type ProfileWorkflowRevisionRepository,\n  type ProfileWorkflowRuntimeFailure,',
            'revision contract exports',
        ),
        (
            '''export {
  createProfileWorkflowCandidate,''',
            '''export { listProfileWorkflowRevisionHistory } from './revision-history.js';
export {
  createProfileWorkflowCandidate,''',
            'revision history function export',
        ),
    ],
)
