const STORAGE_KEY = 'campus-theme';

export function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch { /* noop */ }
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
