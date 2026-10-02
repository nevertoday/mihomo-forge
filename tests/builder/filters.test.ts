import { describe, expect, it } from 'vitest'
import { buildConfig } from '@/core/builder'
import { parseTerms } from '@/core/strategies'
import { loadSourceFromText } from '@/core/parser/loadSource'
import type { FilterStrategy, ProxyGroup } from '@/types'
import { proxiesYaml, settings, ss } from '../helpers'

async function sources() {
  const a = await loadSourceFromText(
    proxiesYaml([
      ss('香港 IEPL 01', 'a1.example'),
      ss('香港 普通 02', 'a2.example'),
      ss('美国 iepl 03', 'a3.example'),
      ss('日本 IEPL 0.1倍', 'a4.example'),
    ]),
    'a.yaml',
  )
  const b = await loadSourceFromText(proxiesYaml([ss('HK IEPL 01', 'b1.example'), ss('US 专线 02', 'b2.example')]), 'b.yaml')
  return [a, b]
}

const filter = (patch: Partial<FilterStrategy>): FilterStrategy => ({
  id: 'f1',
  name: '🚀 IEPL',
  include: [],
  exclude: [],
  regex: false,
  sourceIds: [],
  regionId: null,
  mode: 'url-test',
  ...patch,
})

async function members(f: FilterStrategy) {
  const r = buildConfig(await sources(), settings((s) => s.strategy.filters.push(f)))
  const g = (r.config['proxy-groups'] as ProxyGroup[]).find((x) => x.name === f.name)
  return { r, proxies: g?.proxies ?? null, group: g }
}

describe('keyword groups', () => {
  it('splits keywords on spaces and (full-width) commas', () => {
    expect(parseTerms(' IEPL, 专线，香港  0.1倍 ')).toEqual(['IEPL', '专线', '香港', '0.1倍'])
  })

  it('matches ANY include keyword, case-insensitively, across all sources', async () => {
    const { proxies, group } = await members(filter({ include: ['iepl', '专线'] }))
    expect(proxies).toEqual(['[a] 香港 IEPL 01', '[a] 美国 iepl 03', '[a] 日本 IEPL 0.1倍', '[b] HK IEPL 01', '[b] US 专线 02'])
    expect(group?.type).toBe('url-test')
  })

  it('drops nodes matching any exclude keyword', async () => {
    const { proxies } = await members(filter({ include: ['IEPL'], exclude: ['0.1倍'] }))
    expect(proxies).not.toContain('[a] 日本 IEPL 0.1倍')
    expect(proxies).toHaveLength(3)
  })

  it('combines keywords with a source limit and a region limit (a.yaml + 香港 + IEPL)', async () => {
    const list = await sources()
    const [a] = list
    const r = buildConfig(
      list,
      settings((s) => s.strategy.filters.push(filter({ include: ['IEPL'], sourceIds: [a.id], regionId: 'hk', mode: 'select' }))),
    )
    const g = (r.config['proxy-groups'] as ProxyGroup[]).find((x) => x.name === '🚀 IEPL')!
    expect(g).toEqual({ name: '🚀 IEPL', type: 'select', proxies: ['[a] 香港 IEPL 01'] })
  })

  it('region limit alone works without keywords', async () => {
    const { proxies } = await members(filter({ name: '香港全部', regionId: 'hk' }))
    expect(proxies).toEqual(['[a] 香港 IEPL 01', '[a] 香港 普通 02', '[b] HK IEPL 01'])
  })

  it('matches the original name, not the [source] prefix', async () => {
    const { proxies, r } = await members(filter({ include: ['[a]'] }))
    expect(proxies).toBeNull()
    expect(r.issues).toContainEqual({ level: 'WARNING', code: 'filter-empty', params: { name: '🚀 IEPL' } })
  })

  it('treats keywords literally unless regex is on', async () => {
    expect((await members(filter({ include: ['0.1'] }))).proxies).toEqual(['[a] 日本 IEPL 0.1倍'])
    expect((await members(filter({ include: ['^HK.*IEPL'], regex: true }))).proxies).toEqual(['[b] HK IEPL 01'])
    expect((await members(filter({ include: ['^HK.*IEPL'] }))).proxies).toBeNull()
  })

  it('reports invalid patterns and matches nothing instead of everything', async () => {
    const { r, proxies } = await members(filter({ include: ['(unclosed'], regex: true }))
    expect(proxies).toBeNull()
    expect(r.issues).toContainEqual({ level: 'WARNING', code: 'filter-pattern', params: { name: '🚀 IEPL', pattern: '(unclosed' } })
    expect(r.ok).toBe(true)
  })

  it('can be picked by a site group and is dropped from it when empty', async () => {
    const make = (include: string[]) =>
      settings((s) => {
        s.strategy.filters.push(filter({ include }))
        s.business.chatgpt = { defaultRef: 'filter:f1', candidates: ['filter:f1', 'region:us:auto'] }
      })
    const ok = buildConfig(await sources(), make(['IEPL']))
    expect((ok.config['proxy-groups'] as ProxyGroup[]).find((g) => g.name === '🤖 ChatGPT')!.proxies).toEqual(['🚀 IEPL', '🇺🇸 美国自动'])
    expect(ok.ok).toBe(true)
    const empty = buildConfig(await sources(), make(['不存在的关键词']))
    expect((empty.config['proxy-groups'] as ProxyGroup[]).find((g) => g.name === '🤖 ChatGPT')!.proxies).toEqual(['🇺🇸 美国自动'])
    expect(empty.ok).toBe(true)
  })

  it('a deleted source in the limit makes the group empty, not “all sources”', async () => {
    const { proxies } = await members(filter({ include: ['IEPL'], sourceIds: ['gone'] }))
    expect(proxies).toBeNull()
  })
})
