import type { Locale } from '@/types'

export interface LocaleInfo {
  id: Locale
  /** Name in its own language; never translated. */
  name: string
  dir: 'ltr' | 'rtl'
  /** Extra Google Fonts families for titles/body in this script, loaded on demand. */
  fonts?: string
}

export const LOCALES: LocaleInfo[] = [
  { id: 'zh-CN', name: '简体中文', dir: 'ltr' },
  { id: 'zh-TW', name: '繁體中文', dir: 'ltr', fonts: 'family=Noto+Serif+TC:wght@600;700;900' },
  { id: 'en', name: 'English', dir: 'ltr' },
  { id: 'ja', name: '日本語', dir: 'ltr', fonts: 'family=Noto+Serif+JP:wght@600;700;900' },
  { id: 'ar', name: 'العربية', dir: 'rtl', fonts: 'family=Noto+Naskh+Arabic:wght@600;700&family=Noto+Sans+Arabic:wght@400;500;600;700' },
]

export const LOCALE_IDS = LOCALES.map((l) => l.id)

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALE_IDS as string[]).includes(v)
}

/** Map a BCP 47 tag such as `zh-Hant-HK` or `ar-EG` to a supported locale. */
export function matchLocale(tag: string): Locale | null {
  const t = tag.toLowerCase()
  if (t.startsWith('zh')) return /hant|tw|hk|mo/.test(t) ? 'zh-TW' : 'zh-CN'
  if (t.startsWith('ja')) return 'ja'
  if (t.startsWith('ar')) return 'ar'
  if (t.startsWith('en')) return 'en'
  return null
}
