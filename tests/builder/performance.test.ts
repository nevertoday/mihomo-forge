import { describe, expect, it } from 'vitest'
import { buildConfig } from '@/core/builder'
import { loadSourceFromText } from '@/core/parser/loadSource'
import { proxiesYaml, settings, ss } from '../helpers'

const REGIONS = ['美国', '日本', '新加坡', '香港', '台湾', '韩国', '英国', 'Unknown']

async function sources(perSource: number, count = 6) {
  return Promise.all(
    Array.from({ length: count }, (_, s) =>
      loadSourceFromText(
        proxiesYaml(Array.from({ length: perSource }, (_, i) => ss(`${REGIONS[i % REGIONS.length]} ${i}`, `n${i}.s${s}.example`))),
        `机场${s}.yaml`,
      ),
    ),
  )
}

describe('performance (spec §37)', () => {
  it('imports and builds 6 files / ~1000 nodes in under 2 seconds', async () => {
    const t0 = performance.now()
    const r = buildConfig(await sources(170), settings((s) => (s.rules.preset = 'full')))
    const ms = performance.now() - t0
    expect(r.ok).toBe(true)
    expect(r.stats.nodes).toBe(1020)
    expect(ms).toBeLessThan(2000)
  })

  it('rebuilds 3000 nodes fast enough for interactive editing', async () => {
    const list = await sources(500)
    const t0 = performance.now()
    const r = buildConfig(list, settings())
    expect(r.ok).toBe(true)
    expect(performance.now() - t0).toBeLessThan(1000)
  })
})
