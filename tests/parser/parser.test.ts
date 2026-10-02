import { describe, expect, it } from 'vitest'
import { extractProxyNodes, parseSourceYaml, SourceParseError, sourceNameFromFile } from '@/core/parser'
import { diffSources, loadSourceFromText } from '@/core/parser/loadSource'
import { fingerprintPayload } from '@/core/nodes'
import { loadFixture, proxiesYaml, ss } from '../helpers'

describe('parser', () => {
  it('uses the file name without extension as the source name', async () => {
    expect(sourceNameFromFile('奶昔.yaml')).toBe('奶昔')
    expect(sourceNameFromFile('机场A.YML')).toBe('机场A')
    const s = await loadFixture('奶昔.yaml')
    expect(s.name).toBe('奶昔')
    expect(s.originalFileName).toBe('奶昔.yaml')
  })

  // §41.4
  it('takes only proxies from a complete airport config', async () => {
    const s = await loadFixture('机场A.yaml')
    expect(s.nodes.map((n) => n.originalName)).toEqual(['美国LA', '新加坡01'])
    const { ignoredKeys } = extractProxyNodes(parseSourceYaml(`proxies: []\nrules: []\nproxy-groups: []\ndns: {}`))
    expect(ignoredKeys.sort()).toEqual(['dns', 'proxy-groups', 'rules'])
  })

  it('rejects nodes with missing fields instead of crashing', async () => {
    const s = await loadFixture('机场A.yaml')
    expect(s.rejected).toEqual([{ name: '坏节点', code: 'missing-fields', params: { fields: 'server' } }])
  })

  it('drops airport info nodes when asked', async () => {
    const s = await loadFixture('奶昔.yaml')
    expect(s.nodes.map((n) => n.originalName)).toEqual(['美国01', '日本01'])
    expect(s.rejected[0]).toMatchObject({ code: 'info-node' })
    expect(s.rejected[0].name).toContain('剩余流量')
  })

  it('reports errors as translatable codes instead of crashing', () => {
    const codeOf = (fn: () => unknown) => {
      try {
        fn()
      } catch (err) {
        expect(err).toBeInstanceOf(SourceParseError)
        return (err as SourceParseError).code
      }
      return null
    }
    expect(codeOf(() => parseSourceYaml('proxies: ['))).toBe('yaml')
    expect(codeOf(() => extractProxyNodes(parseSourceYaml('rules: []')))).toBe('no-proxies')
    expect(codeOf(() => extractProxyNodes(parseSourceYaml('proxies: abc')))).toBe('not-array')
    expect(codeOf(() => extractProxyNodes(parseSourceYaml('- a')))).toBe('not-object')
    expect(codeOf(() => parseSourceYaml('   '))).toBe('empty')
  })

  it('coerces string ports', async () => {
    const s = await loadFixture('机场B.yaml')
    expect(s.nodes[0].raw.port).toBe(8443)
  })

  it('fingerprints ignore the node name but not the endpoint', () => {
    expect(fingerprintPayload(ss('A', 'x.example'))).toBe(fingerprintPayload(ss('B', 'X.example')))
    expect(fingerprintPayload(ss('A', 'x.example'))).not.toBe(fingerprintPayload(ss('A', 'y.example')))
  })

  it('diffs a replaced source by fingerprint', async () => {
    const before = await loadSourceFromText(proxiesYaml([ss('a', 'a.example'), ss('b', 'b.example'), ss('c', 'c.example')]), 's.yaml')
    const after = await loadSourceFromText(
      proxiesYaml([ss('a', 'a.example'), ss('b-renamed', 'b.example'), ss('d', 'd.example'), ss('e', 'e.example')]),
      's.yaml',
      { existing: before },
    )
    expect(after.id).toBe(before.id)
    const diff = diffSources(before, after)
    expect(diff).toMatchObject({ oldCount: 3, newCount: 4, added: ['d', 'e'], removed: ['c'] })
    expect(diff.renamed).toEqual([{ from: 'b', to: 'b-renamed' }])
  })
})
