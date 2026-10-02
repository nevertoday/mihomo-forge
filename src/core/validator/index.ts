import type { BuildIssue } from '@/types'

/** Policies that exist without being declared. */
export const BUILTIN_POLICIES = new Set(['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE'])

interface ConfigShape {
  proxies?: { name?: unknown }[]
  'proxy-groups'?: { name?: unknown; proxies?: unknown[]; use?: unknown[] }[]
  rules?: unknown[]
  'rule-providers'?: Record<string, { proxy?: unknown } | unknown>
  'proxy-providers'?: Record<string, unknown>
}

function duplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const dup = new Set<string>()
  for (const v of values) (seen.has(v) ? dup : seen).add(v)
  return [...dup]
}

export function validateUniqueNames(config: ConfigShape): BuildIssue[] {
  const issues: BuildIssue[] = []
  const proxyNames = (config.proxies ?? []).map((p) => String(p.name))
  const groupNames = (config['proxy-groups'] ?? []).map((g) => String(g.name))
  for (const d of duplicates(proxyNames))
    issues.push({ level: 'ERROR', code: 'dup-proxy', params: { name: d } })
  for (const d of duplicates(groupNames))
    issues.push({ level: 'ERROR', code: 'dup-group', params: { name: d } })
  const proxySet = new Set(proxyNames)
  for (const g of new Set(groupNames)) {
    if (proxySet.has(g)) issues.push({ level: 'ERROR', code: 'name-clash', params: { name: g } })
    if (BUILTIN_POLICIES.has(g)) issues.push({ level: 'ERROR', code: 'reserved-name', params: { name: g } })
  }
  return issues
}

export function validateReferences(config: ConfigShape): BuildIssue[] {
  const issues: BuildIssue[] = []
  const proxyNames = new Set((config.proxies ?? []).map((p) => String(p.name)))
  const groupNames = new Set((config['proxy-groups'] ?? []).map((g) => String(g.name)))
  const providers = new Set(Object.keys(config['proxy-providers'] ?? {}))
  for (const g of config['proxy-groups'] ?? []) {
    const members = (g.proxies ?? []).map(String)
    const uses = (g.use ?? []).map(String)
    if (!members.length && !uses.length)
      issues.push({ level: 'ERROR', code: 'empty-group', params: { group: String(g.name) } })
    for (const m of members) {
      if (!proxyNames.has(m) && !groupNames.has(m) && !BUILTIN_POLICIES.has(m))
        issues.push({ level: 'ERROR', code: 'missing-ref', params: { group: String(g.name), name: m } })
      if (m === g.name) issues.push({ level: 'ERROR', code: 'self-ref', params: { group: String(g.name) } })
    }
    for (const u of uses) {
      if (!providers.has(u))
        issues.push({ level: 'ERROR', code: 'missing-provider', params: { group: String(g.name), name: u } })
    }
  }
  return issues
}

/** Rule targets and RULE-SET providers must exist; MATCH must be the last rule. */
export function validateRules(config: ConfigShape): BuildIssue[] {
  const issues: BuildIssue[] = []
  const rules = (config.rules ?? []).map(String)
  const policies = new Set([
    ...(config['proxy-groups'] ?? []).map((g) => String(g.name)),
    ...(config.proxies ?? []).map((p) => String(p.name)),
    ...BUILTIN_POLICIES,
  ])
  const providers = new Set(Object.keys(config['rule-providers'] ?? {}))
  const used = new Set<string>()

  rules.forEach((rule, i) => {
    const parts = rule.split(',').map((s) => s.trim())
    const type = parts[0]?.toUpperCase()
    if (type === 'MATCH') {
      if (!policies.has(parts[1] ?? '')) issues.push({ level: 'ERROR', code: 'match-target', params: { name: parts[1] ?? '' } })
      if (i !== rules.length - 1) issues.push({ level: 'ERROR', code: 'match-position' })
      return
    }
    // Logical rules (AND/OR/NOT/SUB-RULE) carry nested commas; only check their final target.
    const isLogical = ['AND', 'OR', 'NOT'].includes(type ?? '')
    const target = isLogical ? rule.slice(rule.lastIndexOf(')') + 1).split(',')[1]?.trim() : parts[2]
    if (type === 'SUB-RULE') return
    if (!target) {
      issues.push({ level: 'ERROR', code: 'rule-syntax', params: { rule } })
      return
    }
    if (!policies.has(target)) issues.push({ level: 'ERROR', code: 'rule-target', params: { rule, name: target } })
    if (type === 'RULE-SET') {
      const name = parts[1] ?? ''
      used.add(name)
      if (!providers.has(name)) issues.push({ level: 'ERROR', code: 'missing-rule-provider', params: { name } })
    }
  })

  if (rules.length && !rules[rules.length - 1].toUpperCase().startsWith('MATCH'))
    issues.push({ level: 'WARNING', code: 'no-match' })
  for (const [name, def] of Object.entries(config['rule-providers'] ?? {})) {
    const proxy = (def as { proxy?: unknown } | null)?.proxy
    if (proxy !== undefined && !policies.has(String(proxy)))
      issues.push({ level: 'ERROR', code: 'provider-proxy', params: { name, proxy: String(proxy) } })
  }
  const unused = [...providers].filter((p) => !used.has(p))
  if (unused.length)
    issues.push({ level: 'INFO', code: 'unused-provider', params: { count: unused.length } })
  return issues
}

export function validateFinalConfig(config: ConfigShape): BuildIssue[] {
  const issues: BuildIssue[] = []
  if (!(config.proxies ?? []).length)
    issues.push({ level: 'ERROR', code: 'no-proxies' })
  return [...issues, ...validateUniqueNames(config), ...validateReferences(config), ...validateRules(config)]
}

export const hasErrors = (issues: BuildIssue[]) => issues.some((i) => i.level === 'ERROR')
