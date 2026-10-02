import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { buildConfig } from '@/core/builder'
import { classifyRegion } from '@/core/regions'
import { loadSourceFromText, renameSource } from '@/core/parser/loadSource'
import { exportProject, importProject } from '@/core/project/projectFile'
import { DEFAULT_REGIONS } from '@/catalog/regions'
import type { ProxyGroup } from '@/types'
import { exampleSources, proxiesYaml, settings, ss } from '../helpers'

const group = (config: Record<string, unknown>, name: string) =>
  (config['proxy-groups'] as ProxyGroup[]).find((g) => g.name === name)
const groupNames = (config: Record<string, unknown>) => (config['proxy-groups'] as ProxyGroup[]).map((g) => g.name)
const proxyNames = (config: Record<string, unknown>) => (config.proxies as { name: string }[]).map((p) => p.name)

describe('builder — mandatory tests (spec §41)', () => {
  // §41.1
  it('keeps same-named nodes from two files with different source prefixes', async () => {
    const a = await loadSourceFromText(proxiesYaml([ss('美国01', 'a.example')]), '奶昔.yaml')
    const b = await loadSourceFromText(proxiesYaml([ss('美国01', 'b.example')]), '机场A.yaml')
    const r = buildConfig([a, b], settings())
    expect(proxyNames(r.config)).toEqual(['[奶昔] 美国01', '[机场A] 美国01'])
  })

  // §41.2
  it('keeps one copy of identical nodes across files with global dedupe', async () => {
    const a = await loadSourceFromText(proxiesYaml([ss('US-1', 'same.example')]), '奶昔.yaml')
    const b = await loadSourceFromText(proxiesYaml([ss('美国 1', 'same.example')]), '机场A.yaml')
    const r = buildConfig([a, b], settings())
    expect(proxyNames(r.config)).toEqual(['[奶昔] US-1'])
    expect(r.stats.duplicates).toBe(1)
    expect(r.issues).toContainEqual({ level: 'INFO', code: 'dedupe-cross', params: { count: 1, cross: 1 } })

    const none = buildConfig([a, b], settings((s) => (s.dedupeMode = 'none')))
    expect(none.stats.nodes).toBe(2)
    const perSource = buildConfig([a, b], settings((s) => (s.dedupeMode = 'source')))
    expect(perSource.stats.nodes).toBe(2)
  })

  // §41.3
  it('numbers same-named different nodes within one file as #2 / #3', async () => {
    const s = await loadSourceFromText(
      proxiesYaml([ss('美国01', 'a.example'), ss('美国01', 'b.example'), ss('美国01', 'c.example')]),
      '奶昔.yaml',
    )
    const r = buildConfig([s], settings())
    expect(proxyNames(r.config)).toEqual(['[奶昔] 美国01', '[奶昔] 美国01 #2', '[奶昔] 美国01 #3'])
  })

  // §41.4
  it('never copies the airport rules, groups or dns', async () => {
    const r = buildConfig(await exampleSources(), settings())
    expect(groupNames(r.config)).not.toContain('机场A节点选择')
    expect((r.config.rules as string[]).some((x) => x.includes('机场A节点选择'))).toBe(false)
    expect((r.config.dns as Record<string, unknown>).nameserver).not.toEqual(['223.5.5.5'])
  })

  // §41.5
  it('puts unknown regions into 其他 with a warning', async () => {
    const s = await loadSourceFromText(proxiesYaml([ss('神秘节点 01', 'x.example')]), 'x.yaml')
    const r = buildConfig([s], settings())
    expect(r.nodes[0].regionId).toBe('other')
    expect(r.issues).toContainEqual(expect.objectContaining({ level: 'WARNING', code: 'region-unknown' }))
    expect(groupNames(r.config)).toContain('🏳️ 其他手动')
  })

  // §41.6
  it('does not generate a US group without US nodes and drops it from business candidates', async () => {
    const s = await loadSourceFromText(proxiesYaml([ss('日本01', 'jp.example')]), '奶昔.yaml')
    const r = buildConfig([s], settings())
    expect(groupNames(r.config).some((n) => n.includes('美国'))).toBe(false)
    const chatgpt = group(r.config, '🤖 ChatGPT')!
    expect(chatgpt.proxies.some((p) => p.includes('美国'))).toBe(false)
    expect(chatgpt.proxies[0]).toBe('🇯🇵 日本自动')
    expect(r.ok).toBe(true)
  })

  // §41.7
  it('lets ChatGPT pick a region group, a source group and 全部手动 at the same time', async () => {
    const sources = await exampleSources()
    const naixi = sources.find((s) => s.name === '奶昔')!
    const r = buildConfig(
      sources,
      settings((s) => {
        s.business.chatgpt = {
          defaultRef: 'region:us:auto',
          candidates: ['region:us:auto', `source:${naixi.id}`, 'global:manual'],
        }
      }),
    )
    const chatgpt = group(r.config, '🤖 ChatGPT')!
    expect(chatgpt.type).toBe('select')
    expect(chatgpt.proxies).toEqual(['🇺🇸 美国自动', '📦 奶昔', '🌍 全部手动'])
    expect(group(r.config, '🇺🇸 美国自动')!.proxies).toEqual(['[奶昔] 美国01', '[机场A] 美国LA'])
    expect(group(r.config, '📦 奶昔')!.proxies).toEqual(['[奶昔] 美国01', '[奶昔] 日本01'])
    expect(r.ok).toBe(true)
  })

  // §41.8
  it('emits Gemini rules before Google rules', async () => {
    const r = buildConfig(await exampleSources(), settings())
    const rules = r.config.rules as string[]
    const gemini = rules.findIndex((x) => x.includes('google-gemini'))
    const google = rules.findIndex((x) => x.startsWith('RULE-SET,google,'))
    expect(gemini).toBeGreaterThanOrEqual(0)
    expect(google).toBeGreaterThan(gemini)
    expect(rules.findIndex((x) => x.startsWith('RULE-SET,github,'))).toBeLessThan(
      rules.findIndex((x) => x.startsWith('RULE-SET,geolocation-not-cn,')),
    )
    expect(rules.at(-1)).toBe('MATCH,🌐 国外')
  })

  // §41.10
  it('keeps every project setting when one source file is replaced', async () => {
    const sources = await exampleSources()
    const naixi = sources[0]
    const s = settings((x) => {
      x.business.chatgpt = { defaultRef: `source:${naixi.id}`, candidates: [`source:${naixi.id}`, 'global:auto'] }
      x.strategy.composites.push({ id: 'c1', sourceId: naixi.id, regionId: 'us', mode: 'url-test' })
      x.rules.modules = ['ai', 'streaming']
    })
    const before = JSON.stringify(s)
    const replacement = await loadSourceFromText(
      proxiesYaml([ss('美国 02', 'us2.naixi.example'), ss('日本 02', 'jp2.naixi.example')]),
      '奶昔.yaml',
      { existing: naixi },
    )
    const next = [replacement, ...sources.slice(1)]
    const r = buildConfig(next, s)
    expect(JSON.stringify(s)).toBe(before)
    expect(group(r.config, '🤖 ChatGPT')!.proxies).toEqual(['📦 奶昔', '⚡ 全部自动'])
    expect(group(r.config, '🇺🇸 奶昔 / 美国')!.proxies).toEqual(['[奶昔] 美国 02'])
    expect(r.ok).toBe(true)
  })
})

describe('builder — behaviour', () => {
  it('builds the spec §42 minimal example', async () => {
    const r = buildConfig(await exampleSources(), settings())
    expect(proxyNames(r.config)).toEqual(['[奶昔] 美国01', '[奶昔] 日本01', '[机场A] 美国LA', '[机场A] 新加坡01', '[机场B] 日本东京'])
    const names = groupNames(r.config)
    for (const n of ['🌍 全部手动', '⚡ 全部自动', '🇺🇸 美国手动', '🇺🇸 美国自动', '🇯🇵 日本手动', '🇯🇵 日本自动', '🇸🇬 新加坡手动', '🇸🇬 新加坡自动', '📦 奶昔', '📦 机场A', '📦 机场B', '🤖 ChatGPT', '✳️ Claude', '✨ Gemini', '🐙 GitHub', '🇨🇳 国内', '🌐 国外'])
      expect(names).toContain(n)
    expect(names.some((n) => n.includes('香港'))).toBe(false)
    expect(names).not.toContain('📦 奶昔 自动')
    expect(r.ok).toBe(true)
  })

  it('does not create source × region combos unless asked', async () => {
    const r = buildConfig(await exampleSources(), settings())
    expect(r.stats.compositeStrategies).toBe(0)
    expect(groupNames(r.config).some((n) => n.includes(' / '))).toBe(false)
  })

  it('classifies by original name, not the [source] prefix', () => {
    expect(classifyRegion('Tokyo 01', DEFAULT_REGIONS).regionId).toBe('jp')
    expect(classifyRegion('US01', DEFAULT_REGIONS).regionId).toBe('us')
    expect(classifyRegion('Russia 01', DEFAULT_REGIONS).regionId).toBe('ru')
    expect(classifyRegion('100GB 套餐', DEFAULT_REGIONS).regionId).toBe('other')
    expect(classifyRegion('🇭🇰 HK-05 IEPL', DEFAULT_REGIONS).regionId).toBe('hk')
    expect(classifyRegion('香港-日本 中转', DEFAULT_REGIONS).matches).toEqual(['jp', 'hk'])
  })

  it('uses the renamed source in prefixes and group names without re-importing', async () => {
    const [naixi, ...rest] = await exampleSources()
    const r = buildConfig([renameSource(naixi, '奶昔Pro'), ...rest], settings())
    expect(proxyNames(r.config)[0]).toBe('[奶昔Pro] 美国01')
    expect(groupNames(r.config)).toContain('📦 奶昔Pro')
  })

  it('serializes readable UTF-8 YAML without anchors or tags', async () => {
    const r = buildConfig(await exampleSources(), settings())
    expect(r.yaml).toContain('🌐 国外')
    expect(r.yaml).not.toMatch(/&a\d|\*a\d|!!js|!!python/)
    expect(r.yaml).not.toContain('\\U')
    const keys = Object.keys(parse(r.yaml))
    expect(keys.slice(-4)).toEqual(['proxies', 'proxy-groups', 'rules', 'rule-providers'])
    expect(keys.indexOf('dns')).toBeLessThan(keys.indexOf('proxies'))
  })

  it('parses identically under YAML 1.1 (OpenClash/Ruby) and YAML 1.2 (Mihomo)', async () => {
    const tricky = await loadSourceFromText(
      proxiesYaml([
        ss('NO', 'a.example', { password: 'on' }),
        ss('yes', 'b.example', { password: 'off', plugin: 'obfs', 'plugin-opts': { mode: 'y', host: '0755' } }),
        ss('1:20', 'c.example', { password: '0x1F' }),
        ss(':colon', 'd.example', { password: ':secret' }),
      ]),
      'tricky.yaml',
    )
    for (const tpl of ['openclash-standard', 'mihomo-generic'] as const) {
      const r = buildConfig([...(await exampleSources()), tricky], settings((s) => ((s.base.templateId = tpl), (s.rules.preset = 'full'))))
      const v11 = parse(r.yaml, { version: '1.1' })
      const v12 = parse(r.yaml, { version: '1.2' })
      expect(v11).toEqual(v12)
      expect(v12).toEqual(JSON.parse(JSON.stringify(r.config)))
    }
    expect(buildConfig(await exampleSources(), settings()).yaml).toContain('find-process-mode: "off"')
    const withColon = buildConfig([tricky], settings()).yaml
    expect(withColon).toContain('password: ":secret"')
  })

  it('only adds rule providers for enabled services', async () => {
    const lite = buildConfig(await exampleSources(), settings((s) => ((s.rules.preset = 'lite'), (s.rules.modules = []))))
    expect(Object.keys(lite.config['rule-providers'] as object).sort()).toEqual(['cn', 'cn_ip', 'geolocation-not-cn', 'private', 'private_ip'])
    const full = buildConfig(await exampleSources(), settings((s) => (s.rules.preset = 'full')))
    expect(full.stats.businessStrategies).toBeGreaterThan(20)
    expect(full.ok).toBe(true)
  })

  it('downloads rule sets through the overseas group unless DIRECT is chosen', async () => {
    const proxies = (r: ReturnType<typeof buildConfig>) =>
      new Set(Object.values(r.config['rule-providers'] as Record<string, { proxy: string }>).map((p) => p.proxy))
    expect(proxies(buildConfig(await exampleSources(), settings()))).toEqual(new Set(['🌐 国外']))
    const direct = buildConfig(await exampleSources(), settings((s) => (s.rules.downloadDirect = true)))
    expect(proxies(direct)).toEqual(new Set(['DIRECT']))
    expect(direct.ok).toBe(true)
  })

  it('merges a custom base.yaml but keeps generated sections authoritative', async () => {
    const base = 'mixed-port: 1234\nproxies: [{name: x}]\nrules:\n  - DOMAIN,a.com,DIRECT\n  - MATCH,DIRECT\n'
    const r = buildConfig(await exampleSources(), settings((s) => ((s.base.templateId = 'custom'), (s.base.customYaml = base))))
    expect(r.config['mixed-port']).toBe(1234)
    expect(proxyNames(r.config)).not.toContain('x')
    expect((r.config.rules as string[])[0]).not.toBe('DOMAIN,a.com,DIRECT')
    const merged = buildConfig(
      await exampleSources(),
      settings((s) => ((s.base.templateId = 'custom'), (s.base.customYaml = base), (s.base.mergeCustomRules = true))),
    )
    expect((merged.config.rules as string[])[0]).toBe('DOMAIN,a.com,DIRECT')
    expect((merged.config.rules as string[]).filter((x) => x.startsWith('MATCH'))).toHaveLength(1)
  })

  it('exports a project without node credentials by default', async () => {
    const sources = await exampleSources()
    const file = exportProject(settings(), sources)
    const text = JSON.stringify(file)
    expect(text).not.toContain('naixi-jp-1')
    expect(text).not.toContain('us1.naixi.example')
    const back = importProject(text)
    expect(back.sources.map((s) => s.name)).toEqual(['奶昔', '机场A', '机场B'])
    expect(back.sources.every((s) => s.nodes.length === 0)).toBe(true)
    const withNodes = importProject(JSON.stringify(exportProject(settings(), sources, true)))
    expect(withNodes.sources[0].nodes).toHaveLength(2)
  })
})
