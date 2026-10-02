import { describe, expect, it } from 'vitest'
import { buildConfig } from '@/core/builder'
import { NAMING } from '@/core/naming'
import { translate } from '@/i18n/format'
import { matchLocale } from '@/i18n/locales'
import ar from '@/i18n/messages/ar'
import en from '@/i18n/messages/en'
import ja from '@/i18n/messages/ja'
import zhCN from '@/i18n/messages/zh-CN'
import zhTW from '@/i18n/messages/zh-TW'
import { DEFAULT_REGIONS } from '@/catalog/regions'
import { SERVICE_BY_ID } from '@/catalog/services'
import type { IssueCode, Locale, ProxyGroup } from '@/types'
import { exampleSources, settings } from '../helpers'

const CATALOGS = { 'zh-CN': zhCN, 'zh-TW': zhTW, en, ja, ar } as Record<Locale, unknown>

/** Flatten to `key -> every text form` (plural messages contribute each form). */
function leaves(tree: unknown, prefix = ''): Map<string, string[]> {
  const out = new Map<string, string[]>()
  for (const [k, v] of Object.entries(tree as Record<string, unknown>)) {
    const key = prefix + k
    if (typeof v === 'string') out.set(key, [v])
    else if (v && typeof v === 'object' && typeof (v as { other?: unknown }).other === 'string')
      out.set(key, Object.values(v as Record<string, string>))
    else for (const [kk, vv] of leaves(v, `${key}.`)) out.set(kk, vv)
  }
  return out
}
const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('i18n catalogs', () => {
  const source = leaves(zhCN)

  for (const [id, catalog] of Object.entries(CATALOGS)) {
    it(`${id} has exactly the source keys and the same placeholders`, () => {
      const mine = leaves(catalog)
      expect([...mine.keys()].sort()).toEqual([...source.keys()].sort())
      for (const [key, forms] of mine) {
        const expected = params(source.get(key)![0])
        for (const form of forms) {
          // A form may drop {n} (e.g. “one item”) but must not invent or lose any other placeholder.
          expect(params(form).filter((p) => p !== 'n'), `${id}:${key}`).toEqual(expected.filter((p) => p !== 'n'))
        }
      }
    })
  }

  it('translates every issue code the core can emit', () => {
    const codes: IssueCode[] = [
      'base-yaml-parse', 'base-yaml-shape', 'base-overridden', 'base-merged', 'dedupe', 'dedupe-cross',
      'region-unknown', 'region-ambiguous', 'region-pattern', 'rejected', 'empty-source', 'provider-clash',
      'composite-orphan', 'composite-empty', 'candidate-removed', 'default-missing', 'no-candidates', 'no-proxies',
      'dup-proxy', 'dup-group', 'name-clash', 'reserved-name', 'empty-group', 'missing-ref', 'self-ref',
      'missing-provider', 'rule-target', 'match-target', 'match-position', 'rule-syntax', 'missing-rule-provider', 'provider-proxy',
      'no-match', 'unused-provider',
    ]
    for (const catalog of Object.values(CATALOGS)) for (const c of codes) expect(leaves(catalog).has(`issues.${c}`), c).toBe(true)
  })

  it('selects plural forms with Intl.PluralRules', () => {
    expect(translate('en', en, zhCN, 'count.sources', { n: 1 })).toBe('1 source')
    expect(translate('en', en, zhCN, 'count.sources', { n: 6 })).toBe('6 sources')
    expect(translate('zh-CN', zhCN, zhCN, 'count.sources', { n: 6 })).toBe('6 个来源')
    expect(translate('ar', ar, zhCN, 'count.sources', { n: 2 })).toBe('المصادر: 2')
    expect(translate('en', en, zhCN, 'no.such.key')).toBe('no.such.key')
  })

  it('maps browser language tags to supported locales', () => {
    expect(matchLocale('zh-Hant-HK')).toBe('zh-TW')
    expect(matchLocale('zh-TW')).toBe('zh-TW')
    expect(matchLocale('zh')).toBe('zh-CN')
    expect(matchLocale('ja-JP')).toBe('ja')
    expect(matchLocale('ar-EG')).toBe('ar')
    expect(matchLocale('en-GB')).toBe('en')
    expect(matchLocale('fr-FR')).toBeNull()
  })
})

describe('localized group names in config.yaml', () => {
  it('names every region and non-brand service in every output language', () => {
    for (const n of Object.values(NAMING)) {
      for (const r of DEFAULT_REGIONS) expect(n.regions[r.id], r.id).toBeTruthy()
      for (const id of ['lan', 'china', 'foreign', 'ads']) expect(n.services[id], id).toBeTruthy()
    }
    expect(SERVICE_BY_ID.chatgpt.label).toBe('ChatGPT')
  })

  for (const out of ['en', 'ja', 'zh-TW', 'ar'] as Locale[]) {
    it(`builds a valid config with ${out} group names`, async () => {
      const r = buildConfig(await exampleSources(), settings((s) => ((s.outputLocale = out), (s.rules.preset = 'full'))))
      expect(r.ok).toBe(true)
      const names = (r.config['proxy-groups'] as ProxyGroup[]).map((g) => g.name)
      expect(names).toContain(NAMING[out].globalAuto)
      expect(names).toContain(`🇺🇸 ${NAMING[out].regionAuto.replace('{icon} ', '').replace('{region}', NAMING[out].regions.us)}`)
      expect((r.config.rules as string[]).at(-1)).toBe(`MATCH,🌐 ${NAMING[out].services.foreign}`)
      // Node names are never translated.
      expect((r.config.proxies as { name: string }[])[0].name).toBe('[奶昔] 美国01')
    })
  }

  it('produces English names like 🇺🇸 United States Auto', async () => {
    const r = buildConfig(await exampleSources(), settings((s) => (s.outputLocale = 'en')))
    const chat = (r.config['proxy-groups'] as ProxyGroup[]).find((g) => g.name === '🤖 ChatGPT')!
    expect(chat.proxies.slice(0, 2)).toEqual(['🇺🇸 United States Auto', '🇺🇸 United States Manual'])
    expect(chat.proxies).toContain('📦 奶昔')
    expect(chat.proxies).toContain('🌍 All Manual')
  })
})
