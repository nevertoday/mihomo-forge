import { computed, ref, watch } from 'vue'
import { NAMING, regionLabel as namedRegion, serviceLabel as namedService } from '@/core/naming'
import type { BuildIssue, Locale, MessageParams, PoolInfo, RegionDefinition, RuleService } from '@/types'
import { hasMessage, translate, type MessageKey } from './format'
import { isLocale, LOCALES, matchLocale } from './locales'
import ar from './messages/ar'
import en from './messages/en'
import ja from './messages/ja'
import zhCN, { type SourceMessages } from './messages/zh-CN'
import zhTW from './messages/zh-TW'

export { LOCALES } from './locales'

export const CATALOGS: Record<Locale, unknown> = { 'zh-CN': zhCN, 'zh-TW': zhTW, en, ja, ar }

export type Key = MessageKey<SourceMessages>

const STORAGE_KEY = 'mihomo-forge-locale'

/** `?lang=` beats the saved choice, which beats the browser languages. English is the last resort. */
export function detectLocale(): Locale {
  try {
    const q = new URLSearchParams(location.search).get('lang')
    if (q) {
      const m = isLocale(q) ? q : matchLocale(q)
      if (m) return m
    }
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    // storage unavailable
  }
  for (const tag of typeof navigator === 'undefined' ? [] : navigator.languages ?? [navigator.language]) {
    const m = matchLocale(tag)
    if (m) return m
  }
  return 'en'
}

export const locale = ref<Locale>(typeof window === 'undefined' ? 'zh-CN' : detectLocale())
export const localeInfo = computed(() => LOCALES.find((l) => l.id === locale.value)!)

export function t(key: Key, params?: MessageParams): string {
  return translate(locale.value, CATALOGS[locale.value], zhCN, key, params)
}

/** For keys built at runtime (service descriptions, issue codes). Returns '' when missing. */
export function tDynamic(key: string, params?: MessageParams): string {
  return hasMessage(CATALOGS[locale.value], key) || hasMessage(zhCN, key)
    ? translate(locale.value, CATALOGS[locale.value], zhCN, key, params)
    : ''
}

export const regionName = (r: Pick<RegionDefinition, 'id' | 'label'>) => namedRegion(r, locale.value)
export const serviceName = (s: Pick<RuleService, 'id' | 'label'>) => namedService(s, locale.value)

/** Issue params may reference catalog ids; resolve them to labels in the viewer's language. */
export function issueText(issue: BuildIssue, services: Record<string, RuleService>): string {
  const params = { ...issue.params }
  if (params.n === undefined && params.count !== undefined) params.n = params.count
  if (typeof params.service === 'string' && services[params.service]) params.service = serviceName(services[params.service])
  return tDynamic(`issues.${issue.code}`, params) || issue.code
}

export function poolText(pool: PoolInfo, regions: RegionDefinition[]): string {
  const region = pool.regionId ? regions.find((r) => r.id === pool.regionId) : undefined
  const params = { n: pool.count, region: region ? regionName(region) : '', source: pool.sourceName ?? '' }
  return t(`pool.${pool.kind}`, params)
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(locale.value)
  } catch {
    return iso
  }
}

const fontLinks = new Set<string>()
function loadFonts(id: Locale) {
  const info = LOCALES.find((l) => l.id === id)
  if (!info?.fonts || fontLinks.has(id)) return
  fontLinks.add(id)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${info.fonts}&display=swap`
  document.head.appendChild(link)
}

function apply(id: Locale) {
  const info = LOCALES.find((l) => l.id === id)!
  const html = document.documentElement
  html.lang = id
  html.dir = info.dir
  document.title = 'Mihomo Forge'
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('app.description'))
  loadFonts(id)
}

export function setLocale(id: Locale) {
  locale.value = id
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  apply(locale.value)
  watch(locale, apply)
}

/** Example group name in a given output language, for explanations in the UI. */
export function exampleGroupName(output: Locale): string {
  const n = NAMING[output]
  return n.regionAuto.replace('{icon}', '🇺🇸').replace('{region}', n.regions.us)
}
