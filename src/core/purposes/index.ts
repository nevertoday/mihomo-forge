import { purposeName } from '@/catalog/purposes'
import { OTHER_REGION_ID } from '@/catalog/regions'
import { fill, NAMING, regionLabel } from '@/core/naming'
import type {
  BuildIssue,
  Line,
  LineRef,
  Locale,
  ProxyGroup,
  ProxyNode,
  Purpose,
  PurposeGroup,
  PurposeMode,
  RegionDefinition,
  Source,
  StrategyGroup,
  StrategySettings,
} from '@/types'

export interface LineContext {
  nodes: ProxyNode[]
  sources: Source[]
  regions: RegionDefinition[]
  settings: StrategySettings
  locale: Locale
  /** Advanced groups (keyword filters, source × region) that purposes may also use. */
  extra: StrategyGroup[]
}

export interface LineSet {
  lines: Line[]
  /** Groups to write into config.yaml for the lines (nodes and builtins need none). */
  groups: ProxyGroup[]
  byRef: Map<LineRef, Line>
}

function testedGroup(name: string, type: PurposeMode, proxies: string[], s: StrategySettings): ProxyGroup {
  if (type === 'select') return { name, type, proxies }
  return { name, type, proxies, url: s.testUrl, interval: s.interval, ...(type === 'url-test' ? { tolerance: s.tolerance } : {}) }
}

const uniq = (xs: string[]) => [...new Set(xs)]

/**
 * Every line a purpose can choose. Regions merge nodes from every file (that is the point:
 * all Japan nodes, whichever provider, become one “Japan” line that uses the fastest).
 */
export function buildLines(ctx: LineContext): LineSet {
  const { nodes, sources, regions, settings, locale } = ctx
  const n = NAMING[locale]
  const lines: Line[] = []
  const groups: ProxyGroup[] = []
  const names = (xs: ProxyNode[]) => xs.map((x) => x.displayName)

  if (nodes.length) {
    const name = n.globalAuto
    groups.push(testedGroup(name, 'url-test', names(nodes), settings))
    lines.push({ ref: 'all', kind: 'all', name, nodeCount: nodes.length, sourceNames: uniq(nodes.map((x) => x.sourceName)) })
  }
  for (const region of regions) {
    const members = nodes.filter((x) => (x.regionId ?? OTHER_REGION_ID) === region.id)
    if (!members.length) continue
    const name = fill(n.regionAuto, { icon: region.icon, region: regionLabel(region, locale) })
    groups.push(testedGroup(name, 'url-test', names(members), settings))
    lines.push({
      ref: `region:${region.id}`,
      kind: 'region',
      name,
      nodeCount: members.length,
      regionId: region.id,
      sourceNames: uniq(members.map((x) => x.sourceName)),
    })
  }
  for (const source of sources) {
    const members = nodes.filter((x) => x.sourceId === source.id)
    if (!members.length) continue
    const name = fill(n.sourceAuto, { source: source.name })
    groups.push(testedGroup(name, 'url-test', names(members), settings))
    lines.push({ ref: `source:${source.id}`, kind: 'source', name, nodeCount: members.length, sourceId: source.id })
  }
  for (const s of ctx.extra) {
    groups.push(s.group)
    lines.push({ ref: s.ref, kind: s.kind === 'filter' ? 'filter' : 'composite', name: s.group.name, nodeCount: s.nodeCount })
  }
  for (const node of nodes)
    lines.push({ ref: `node:${node.fingerprint}`, kind: 'node', name: node.displayName, nodeCount: 1, sourceId: node.sourceId, regionId: node.regionId ?? OTHER_REGION_ID })
  lines.push({ ref: 'DIRECT', kind: 'builtin', name: 'DIRECT', nodeCount: 0 })
  lines.push({ ref: 'REJECT', kind: 'builtin', name: 'REJECT', nodeCount: 0 })

  return { lines, groups, byRef: new Map(lines.map((l) => [l.ref, l])) }
}

/**
 * One group per purpose. Lines whose nodes are not in the current files are skipped (and reported),
 * so a purpose set up for “US first” still works when today's files have no US nodes.
 */
export function generatePurposeGroups(
  purposes: Purpose[],
  set: LineSet,
  settings: StrategySettings,
  issues: BuildIssue[],
  locale: Locale = 'zh-CN',
): PurposeGroup[] {
  const fallbackLine = set.byRef.get('all') ?? set.byRef.get('DIRECT')!
  return purposes.map((purpose) => {
    const name = purposeName(purpose, locale)
    const lines: Line[] = []
    const missing: LineRef[] = []
    for (const ref of uniq(purpose.lines)) {
      const line = set.byRef.get(ref)
      if (line) lines.push(line)
      else missing.push(ref)
    }
    if (missing.length && lines.length)
      issues.push({ level: 'INFO', code: 'purpose-line-missing', params: { purpose: name, count: missing.length } })
    if (!lines.length) {
      lines.push(fallbackLine)
      issues.push({ level: 'WARNING', code: 'purpose-no-lines', params: { purpose: name, line: fallbackLine.name } })
    }
    // A tested group of only DIRECT / REJECT makes no sense; it is a plain choice.
    const onlyBuiltins = lines.every((l) => l.kind === 'builtin')
    const mode: PurposeMode = onlyBuiltins ? 'select' : purpose.mode
    return { purpose, lines, missing, group: testedGroup(name, mode, lines.map((l) => l.name), settings) }
  })
}

const DOMAIN_RE = /^(?:\*\.|\+\.|\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)$/i
const KEYWORD_RE = /^[a-z0-9-]{2,}$/i

/** A site entry as a rule: `example.com` → DOMAIN-SUFFIX, `openai` (no dot) → DOMAIN-KEYWORD. */
export function domainRule(entry: string, target: string): string | null {
  const s = entry.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
  const d = DOMAIN_RE.exec(s)
  if (d) return `DOMAIN-SUFFIX,${d[1].toLowerCase()},${target}`
  if (KEYWORD_RE.test(s)) return `DOMAIN-KEYWORD,${s.toLowerCase()},${target}`
  return null
}

/** Custom sites come first, so they win over every rule set. */
export function purposeDomainRules(groups: PurposeGroup[], issues: BuildIssue[]): string[] {
  const rules: string[] = []
  const seen = new Set<string>()
  for (const { purpose, group } of groups) {
    for (const entry of purpose.domains) {
      if (!entry.trim()) continue
      const rule = domainRule(entry, group.name)
      if (!rule) {
        issues.push({ level: 'WARNING', code: 'purpose-domain', params: { purpose: purpose.name, entry } })
        continue
      }
      const key = rule.slice(0, rule.lastIndexOf(','))
      if (seen.has(key)) continue
      seen.add(key)
      rules.push(rule)
    }
  }
  return rules
}

/** Service id → purpose group name; the first purpose that lists a service wins. */
export function purposeTargets(groups: PurposeGroup[]): Record<string, string> {
  const targets: Record<string, string> = {}
  for (const { purpose, group } of groups) for (const id of purpose.services) targets[id] ??= group.name
  return targets
}
