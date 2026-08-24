import { describe, expect, it } from 'vitest';

import {
  readSwitchSourceEditorMode,
  storeSwitchSourceEditorMode,
  switchSourceEditorStateKey,
} from './switch-editor-state';

class MemoryStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('Switch source editor UI state', () => {
  it('persists source mode independently for stable Profile IDs', () => {
    const storage = new MemoryStorage();
    const firstKey = switchSourceEditorStateKey('switch-first');
    expect(firstKey).toBe('zeroomega-nex/options/switch-source-editor/switch-first');
    expect(readSwitchSourceEditorMode('switch-first', storage)).toBe(false);

    storeSwitchSourceEditorMode('switch-first', true, storage);
    expect(readSwitchSourceEditorMode('switch-first', storage)).toBe(true);
    expect(readSwitchSourceEditorMode('switch-second', storage)).toBe(false);

    storeSwitchSourceEditorMode('switch-first', false, storage);
    expect(readSwitchSourceEditorMode('switch-first', storage)).toBe(false);
    expect(storage.values.has(firstKey)).toBe(false);
  });

  it('does not let unavailable UI storage block the editor', () => {
    const unavailable = {
      getItem: () => {
        throw new Error('unavailable');
      },
      setItem: () => {
        throw new Error('unavailable');
      },
      removeItem: () => {
        throw new Error('unavailable');
      },
    };
    expect(readSwitchSourceEditorMode('switch-safe', unavailable)).toBe(false);
    expect(() => storeSwitchSourceEditorMode('switch-safe', true, unavailable)).not.toThrow();
  });
});
