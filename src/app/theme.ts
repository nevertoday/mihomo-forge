import { ref } from 'vue'

/**
 * Appearance lives in the 小小东 UI Kit's theme store (public/vendor/xxd/boot.js, loaded before first paint):
 * it sets data-theme / data-corners / data-accent on <html> and remembers the viewer's choice.
 */
export type ThemePref = 'system' | 'light' | 'dark'

interface XxdThemeApi {
  read(): { theme?: ThemePref }
  set(patch: { theme: ThemePref }): unknown
  resolveTheme(pref: ThemePref): 'light' | 'dark'
}
const store = (globalThis as { XxdTheme?: XxdThemeApi }).XxdTheme

// One-time carry-over from the key used before the UI Kit.
const LEGACY_KEY = 'mihomo-forge-theme'
try {
  const legacy = localStorage.getItem(LEGACY_KEY)
  if (legacy) {
    if ((legacy === 'light' || legacy === 'dark') && !store?.read().theme) store?.set({ theme: legacy })
    localStorage.removeItem(LEGACY_KEY)
  }
} catch {
  // storage can be unavailable
}

export const themePref = ref<ThemePref>(store?.read().theme ?? 'system')

export function isDark(): boolean {
  return document.documentElement.dataset.theme === 'dark'
}

export function toggleTheme() {
  themePref.value = isDark() ? 'light' : 'dark'
  store?.set({ theme: themePref.value })
}
