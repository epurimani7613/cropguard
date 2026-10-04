export type ThemeMode = 'dark' | 'light';

const KEY = 'cropguard.theme';

export function readStoredTheme(): ThemeMode | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw === 'dark' || raw === 'light' ? raw : null;
  } catch {
    return null;
  }
}

export function storeTheme(mode: ThemeMode) {
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* storage blocked — the theme simply will not persist */
  }
}