import { OTHER_REGION_ID } from '@/catalog/regions'
import { fill, NAMING, regionLabel, type Naming } from '@/core/naming'
import type {
  BuildIssue,
  FilterStrategy,
  GroupMode,
  Locale,
  ProxyGroup,
  ProxyNode,
  RegionDefinition,
  Source,
  StrategyGroup,
  StrategySettings,
} from '@/types'

export const BUILTIN_TARGETS = ['DIRECT', 'REJECT'] as const

export interface StrategyContext {
  nodes: ProxyNode[]
  sources: Source[]
  regions: RegionDefinition[]
  settings: StrategySettings
  /** Language of generated group names. Defaults to zh-CN. */
  locale?: Locale
}

const naming = (ctx: { locale?: Locale }): Naming => NAMING[ctx.locale ?? 'zh-CN']

function makeGroup(name: string, type: GroupMode, proxies: string[], s: StrategySettings): ProxyGroup {
  if (type === 'select') return { name, type, proxies }
  return {
    name,
    type,
    proxies,
    url: s.testUrl,
    interval: s.interval,
    ...(type === 'url-test' ? { tolerance: s.tolerance } : {}),
  }
}

const names = (nodes: ProxyNode[]) => nodes.map((n) => n.displayName)





/** Source × region groups are only created on request, never as a Cartesian product (spec §15.4). */
export function generateCompositeGroups(ctx: StrategyContext, issues: BuildIssue[] = []): StrategyGroup[] {
  const { nodes, sources, regions, settings } = ctx
  const n = naming(ctx)
  const out: StrategyGroup[] = []
  for (const c of settings.composites) {
    const source = sources.find((s) => s.id === c.sourceId)
    const region = regions.find((r) => r.id === c.regionId)
    if (!source || !region) {
      issues.push({ level: 'WARNING', code: 'composite-orphan' })
      continue
    }
    const members = nodes.filter((n) => n.sourceId === source.id && (n.regionId ?? OTHER_REGION_ID) === region.id)
    const name =
      c.displayName?.trim() ||
      fill(n.composite, { icon: region.icon, source: source.name, region: regionLabel(region, ctx.locale ?? 'zh-CN') })
    if (!members.length) {
      issues.push({ level: 'WARNING', code: 'composite-empty', params: { name } })
      continue
    }
    out.push({
      ref: `composite:${c.id}`,
      kind: 'composite',
      group: makeGroup(name, c.mode, names(members), settings),
      pool: { kind: 'composite', count: members.length, regionId: region.id, sourceName: source.name },
      nodeCount: members.length,
    })
  }
  return out
}

/** Split user input like `IEPL, 专线  香港` into terms. Commas (，too) and whitespace separate terms. */
export function parseTerms(text: string): string[] {
  return text
    .split(/[,，、\s]+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

export interface CompiledFilter {
  include: RegExp[]
  exclude: RegExp[]
  invalid: string[]
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Plain keywords match literally; with `regex` each term is a case-insensitive pattern. Bad patterns are reported, not thrown. */
export function compileFilter(f: Pick<FilterStrategy, 'include' | 'exclude' | 'regex'>): CompiledFilter {
  const invalid: string[] = []
  const build = (terms: string[]) =>
    terms.flatMap((t) => {
      try {
        return [new RegExp(f.regex ? t : escapeRe(t), 'iu')]
      } catch {
        invalid.push(t)
        return []
      }
    })
  return { include: build(f.include), exclude: build(f.exclude), invalid }
}

/** Does this node belong to the filter group? Matches the ORIGINAL name, never the `[source]` prefix. */
export function matchesFilter(
  node: Pick<ProxyNode, 'originalName' | 'sourceId' | 'regionId'>,
  f: Pick<FilterStrategy, 'include' | 'sourceIds' | 'regionId'>,
  compiled: CompiledFilter,
): boolean {
  if (f.sourceIds.length && !f.sourceIds.includes(node.sourceId)) return false
  if (f.regionId && (node.regionId ?? OTHER_REGION_ID) !== f.regionId) return false
  // Every include term failed to compile: match nothing rather than everything.
  if (f.include.length && !compiled.include.length) return false
  if (compiled.include.length && !compiled.include.some((re) => re.test(node.originalName))) return false
  return !compiled.exclude.some((re) => re.test(node.originalName))
}

/** Keyword groups (spec extension): user-named, explicit node lists, never empty. */
export function generateFilterGroups(ctx: StrategyContext, issues: BuildIssue[] = []): StrategyGroup[] {
  const { nodes, settings } = ctx
  const out: StrategyGroup[] = []
  for (const f of settings.filters ?? []) {
    const name = f.name.trim()
    if (!name) continue
    const compiled = compileFilter(f)
    for (const pattern of compiled.invalid) issues.push({ level: 'WARNING', code: 'filter-pattern', params: { name, pattern } })
    const members = nodes.filter((n) => matchesFilter(n, f, compiled))
    if (!members.length) {
      issues.push({ level: 'WARNING', code: 'filter-empty', params: { name } })
      continue
    }
    out.push({
      ref: `filter:${f.id}`,
      kind: 'filter',
      group: makeGroup(name, f.mode, names(members), settings),
      pool: { kind: 'filter', count: members.length },
      nodeCount: members.length,
    })
  }
  return out
}




