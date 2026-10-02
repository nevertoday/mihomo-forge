import { OTHER_REGION_ID } from '@/catalog/regions'
import { fill, NAMING, regionLabel, serviceLabel, type Naming } from '@/core/naming'
import type {
  BuildIssue,
  BusinessGroup,
  BusinessStrategySetting,
  FilterStrategy,
  GroupMode,
  Locale,
  ProxyGroup,
  ProxyNode,
  RegionDefinition,
  RuleService,
  Source,
  StrategyGroup,
  StrategyRef,
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

/** Bucket used for region groups: disabled regions fall back to “other”. */
export function effectiveRegionId(node: ProxyNode, settings: StrategySettings): string {
  const id = node.regionId ?? OTHER_REGION_ID
  return settings.enabledRegions[id] ? id : OTHER_REGION_ID
}

export function generateGlobalGroups(ctx: StrategyContext): StrategyGroup[] {
  const { nodes, settings } = ctx
  if (!nodes.length) return []
  const n = naming(ctx)
  const all = names(nodes)
  const out: StrategyGroup[] = []
  const pool = { kind: 'all', count: all.length } as const
  if (settings.globalManual)
    out.push({ ref: 'global:manual', kind: 'global', group: makeGroup(n.globalManual, 'select', all, settings), pool, nodeCount: all.length })
  if (settings.globalAuto)
    out.push({ ref: 'global:auto', kind: 'global', group: makeGroup(n.globalAuto, 'url-test', all, settings), pool, nodeCount: all.length })
  if (settings.globalFallback)
    out.push({ ref: 'global:fallback', kind: 'global', group: makeGroup(n.globalFallback, 'fallback', all, settings), pool, nodeCount: all.length })
  return out
}

/** One manual + one auto group per enabled region that actually has nodes; never an empty group (spec §15.2). */
export function generateRegionGroups(ctx: StrategyContext): StrategyGroup[] {
  const { nodes, regions, settings } = ctx
  if (!settings.byRegion) return []
  const n = naming(ctx)
  const out: StrategyGroup[] = []
  for (const region of regions) {
    if (!settings.enabledRegions[region.id]) continue
    const members = nodes.filter((n) => effectiveRegionId(n, settings) === region.id)
    if (!members.length) continue
    const modes = settings.regionModes[region.id] ?? { manual: true, auto: true }
    const pool = { kind: 'region', count: members.length, regionId: region.id } as const
    const params = { icon: region.icon, region: regionLabel(region, ctx.locale ?? 'zh-CN') }
    if (modes.manual)
      out.push({
        ref: `region:${region.id}:manual`,
        kind: 'region',
        group: makeGroup(fill(n.regionManual, params), 'select', names(members), settings),
        pool,
        nodeCount: members.length,
      })
    if (modes.auto)
      out.push({
        ref: `region:${region.id}:auto`,
        kind: 'region',
        group: makeGroup(fill(n.regionAuto, params), 'url-test', names(members), settings),
        pool,
        nodeCount: members.length,
      })
  }
  return out
}

/** One manual group per source; an auto group only when switched on for that source (spec §15.3). */
export function generateSourceGroups(ctx: StrategyContext): StrategyGroup[] {
  const { nodes, sources, settings } = ctx
  if (!settings.bySource) return []
  const n = naming(ctx)
  const out: StrategyGroup[] = []
  for (const source of sources) {
    const members = nodes.filter((n) => n.sourceId === source.id)
    if (!members.length) continue
    const pool = { kind: 'source', count: members.length, sourceName: source.name } as const
    out.push({
      ref: `source:${source.id}`,
      kind: 'source',
      group: makeGroup(fill(n.sourceManual, { source: source.name }), 'select', names(members), settings),
      pool,
      nodeCount: members.length,
    })
    if (settings.sourceAuto[source.id])
      out.push({
        ref: `source:${source.id}:auto`,
        kind: 'source',
        group: makeGroup(fill(n.sourceAuto, { source: source.name }), 'url-test', names(members), settings),
        pool,
        nodeCount: members.length,
      })
  }
  return out
}

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

/** Expand catalog tokens (`regions:auto`, `regions:manual`, `sources:all`) against what was generated. */
export function expandRefs(refs: StrategyRef[], available: StrategyGroup[]): StrategyRef[] {
  const out: StrategyRef[] = []
  const push = (r: StrategyRef) => {
    if (!out.includes(r)) out.push(r)
  }
  for (const ref of refs) {
    if (ref === 'regions:auto' || ref === 'regions:manual') {
      const mode = ref.split(':')[1]
      available.filter((g) => g.kind === 'region' && g.ref.endsWith(`:${mode}`)).forEach((g) => push(g.ref))
    } else if (ref === 'sources:all') {
      available.filter((g) => g.kind === 'source' && !g.ref.endsWith(':auto')).forEach((g) => push(g.ref))
    } else push(ref)
  }
  return out
}

export function serviceGroupName(service: RuleService, locale: Locale = 'zh-CN'): string {
  return `${service.icon} ${serviceLabel(service, locale)}`
}

/** The setting the UI starts from when the user has not customised a service. */
export function defaultBusinessSetting(service: RuleService, available: StrategyGroup[]): BusinessStrategySetting {
  const known = new Set<string>([...available.map((g) => g.ref), ...BUILTIN_TARGETS])
  const candidates = expandRefs(service.defaultStrategyCandidates, available).filter((r) => known.has(r))
  return { defaultRef: candidates[0] ?? 'DIRECT', candidates }
}

/**
 * Business groups are always `select` and only reference node strategies, never nodes.
 * Candidates whose strategy was not generated (e.g. no US nodes) are dropped automatically,
 * and the default strategy is placed first (spec §16–17).
 */
export function generateBusinessGroups(
  services: RuleService[],
  settings: Record<string, BusinessStrategySetting>,
  available: StrategyGroup[],
  issues: BuildIssue[] = [],
  locale: Locale = 'zh-CN',
): BusinessGroup[] {
  const byRef = new Map(available.map((g) => [g.ref, g]))
  const refName = (ref: StrategyRef) => byRef.get(ref)?.group.name ?? ref
  const exists = (ref: StrategyRef) => byRef.has(ref) || (BUILTIN_TARGETS as readonly string[]).includes(ref)
  const out: BusinessGroup[] = []

  for (const service of services) {
    if (service.fixedTarget) continue
    const name = serviceGroupName(service, locale)
    const custom = settings[service.id]
    const base = custom ?? defaultBusinessSetting(service, available)
    const expanded = expandRefs(base.candidates, available)
    const missing = expanded.filter((r) => !exists(r))
    let candidates = expanded.filter(exists)
    if (missing.length && custom) {
      issues.push({ level: 'INFO', code: 'candidate-removed', params: { service: service.id, count: missing.length } })
    }

    let defaultRef = base.defaultRef
    if (!exists(defaultRef)) {
      const fallback = candidates[0] ?? (byRef.has('global:manual') ? 'global:manual' : 'DIRECT')
      if (custom)
        issues.push({
          level: 'WARNING',
          code: 'default-missing',
          params: { service: service.id, from: refName(defaultRef), to: refName(fallback) },
        })
      defaultRef = fallback
    }
    if (!candidates.length) {
      issues.push({ level: 'WARNING', code: 'no-candidates', params: { service: service.id, name: refName(defaultRef) } })
    }
    candidates = [defaultRef, ...candidates.filter((r) => r !== defaultRef)]

    out.push({
      service,
      group: { name, type: 'select', proxies: candidates.map(refName) },
      defaultRef,
      candidateRefs: candidates,
    })
  }
  return out
}
