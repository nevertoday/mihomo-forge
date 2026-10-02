import { ref } from 'vue'

export type ThemePref = 'system' | 'light' | 'dark'
const KEY = 'mihomo-forge-theme'

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

export const themePref = ref<ThemePref>(read())

const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null

function apply() {
  const dark = themePref.value === 'dark' || (themePref.value === 'system' && !!media?.matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
}

media?.addEventListener('change', apply)

export function isDark(): boolean {
  return document.documentElement.dataset.theme === 'dark'
}

/** Theme is a per-viewer convenience, the only thing kept in localStorage. */
export function toggleTheme() {
  themePref.value = isDark() ? 'light' : 'dark'
  try {
    localStorage.setItem(KEY, themePref.value)
  } catch {
    // ignore: storage can be unavailable
  }
  apply()
}
