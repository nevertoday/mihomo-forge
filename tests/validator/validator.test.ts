import { describe, expect, it } from 'vitest'
import { buildConfig } from '@/core/builder'
import { hasErrors, validateFinalConfig } from '@/core/validator'
import { exampleSources, settings } from '../helpers'

const base = () => ({
  proxies: [{ name: 'n1' }, { name: 'n2' }],
  'proxy-groups': [
    { name: '🇺🇸 美国自动', type: 'url-test', proxies: ['n1'] },
    { name: '🤖 ChatGPT', type: 'select', proxies: ['🇺🇸 美国自动', 'DIRECT'] },
  ],
  rules: ['RULE-SET,openai,🤖 ChatGPT', 'MATCH,DIRECT'],
  'rule-providers': { openai: {} },
})

describe('validator', () => {
  // §41.9
  it('flags a missing group reference as ERROR and blocks export', () => {
    const c = base()
    c['proxy-groups'][0].name = '🇯🇵 日本自动'
    const issues = validateFinalConfig(c)
    expect(issues).toContainEqual({ level: 'ERROR', code: 'missing-ref', params: { group: '🤖 ChatGPT', name: '🇺🇸 美国自动' } })
    expect(hasErrors(issues)).toBe(true)
  })

  it('passes a consistent config', () => {
    expect(hasErrors(validateFinalConfig(base()))).toBe(false)
  })

  it('checks unique names, RULE-SET providers, rule targets and MATCH position', () => {
    const c = base()
    c.proxies.push({ name: 'n1' })
    c['proxy-groups'].push({ name: 'n2', type: 'select', proxies: ['n1'] })
    c['proxy-groups'].push({ name: 'empty', type: 'select', proxies: [] })
    c.rules = ['MATCH,DIRECT', 'RULE-SET,missing,🤖 ChatGPT', 'DOMAIN,a.com,nowhere']
    const codes = validateFinalConfig(c).map((i) => i.code)
    expect(codes).toEqual(
      expect.arrayContaining(['dup-proxy', 'name-clash', 'empty-group', 'missing-rule-provider', 'rule-target', 'match-position']),
    )
  })

  it('accepts logical rules and no-resolve suffixes', () => {
    const c = base()
    c.rules = ['AND,((DOMAIN,a.com),(NETWORK,UDP)),REJECT', 'IP-CIDR,1.1.1.0/24,DIRECT,no-resolve', 'MATCH,DIRECT']
    expect(hasErrors(validateFinalConfig(c))).toBe(false)
  })

  it('reports an error when there are no nodes at all', () => {
    const r = buildConfig([], settings())
    expect(r.ok).toBe(false)
    expect(r.issues.some((i) => i.code === 'no-proxies')).toBe(true)
  })

  it('generated configs from the example pass with no errors', async () => {
    const r = buildConfig(await exampleSources(), settings((s) => (s.rules.preset = 'full')))
    expect(r.issues.filter((i) => i.level === 'ERROR')).toEqual([])
  })
})
