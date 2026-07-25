export type ThemeMode = 'auto' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'zeroomega-nex/theme-mode' as const;

export function readThemeMode(storage: Pick<Storage, 'getItem'> = localStorage): ThemeMode {
  const stored = storage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'auto';
}

export function applyThemeMode(mode: ThemeMode, root: HTMLElement = document.documentElement): void {
  root.dataset.themeMode = mode;
  if (mode === 'auto') delete root.dataset.theme;
  else root.dataset.theme = mode;
}

export function storeThemeMode(
  mode: ThemeMode,
  storage: Pick<Storage, 'setItem'> = localStorage,
  root: HTMLElement = document.documentElement,
): void {
  storage.setItem(THEME_STORAGE_KEY, mode);
  applyThemeMode(mode, root);
}
