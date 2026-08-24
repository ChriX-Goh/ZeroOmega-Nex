export const SWITCH_SOURCE_EDITOR_STATE_PREFIX =
  'zeroomega-nex/options/switch-source-editor/' as const;

interface SwitchEditorStateStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function switchSourceEditorStateKey(profileId: string): string {
  if (!profileId) throw new TypeError('Switch Profile ID must not be empty');
  return `${SWITCH_SOURCE_EDITOR_STATE_PREFIX}${profileId}`;
}

export function readSwitchSourceEditorMode(
  profileId: string,
  storage: SwitchEditorStateStorage = localStorage,
): boolean {
  try {
    return storage.getItem(switchSourceEditorStateKey(profileId)) === 'source';
  } catch {
    return false;
  }
}

export function storeSwitchSourceEditorMode(
  profileId: string,
  sourceMode: boolean,
  storage: SwitchEditorStateStorage = localStorage,
): void {
  try {
    const key = switchSourceEditorStateKey(profileId);
    if (sourceMode) storage.setItem(key, 'source');
    else storage.removeItem(key);
  } catch {
    // UI-state persistence must never block profile editing.
  }
}
