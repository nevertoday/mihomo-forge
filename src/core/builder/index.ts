import { parse } from 'yaml'
import { ALL_SERVICES, FOREIGN_SERVICE_ID } from '@/catalog/services'
import { assignDisplayNames, deduplicateNodes, toOutputProxy } from '@/core/nodes'
import { classifyNodes, invalidPatterns } from '@/core/regions'
import { generateRuleProviders, generateRules } from '@/core/rules'
import { buildLines, generatePurposeGroups, purposeDomainRules, purposeTargets } from '@/core/purposes'
import { generateCompositeGroups, generateFilterGroups, type StrategyContext } from '@/core/strategies'
import { hasErrors, validateFinalConfig } from '@/core/validator'
import { BASE_TEMPLATES } from '@/templates/base'
import type { BuildIssue, BuildResult, ProjectSettings, ProxyNode, Source } from '@/types'
import { serializeConfig } from './serialize'

const GENERATED_KEYS = ['proxies', 'proxy-groups', 'rules', 'rule-providers'] as const

export interface BaseResolution {
  base: Record<string, unknown>
  extraRules: string[]
  extraProviders: Record<string, unknown>
}

/** Step 16 input: the template minus anything the builder owns. */
export function resolveBaseTemplate(settings: ProjectSettings, issues: BuildIssue[]): BaseResolution {
  const empty = { extraRules: [], extraProviders: {} }
  if (settings.base.templateId !== 'custom') {
    return { base: structuredClone(BASE_TEMPLATES[settings.base.templateId]), ...empty }
  }
  let doc: unknown
  try {
    doc = parse(settings.base.customYaml || '{}')
  } catch (err) {
    issues.push({ level: 'ERROR', code: 'base-yaml-parse', params: { detail: (err as Error).message.split('\n')[0] } })
    return { base: {}, ...empty }
  }
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    issues.push({ level: 'ERROR', code: 'base-yaml-shape' })
    return { base: {}, ...empty }
  }
  const base = { ...(doc as Record<string, unknown>) }
  const ignored = GENERATED_KEYS.filter((k) => k in base)
  let extraRules: string[] = []
  let extraProviders: Record<string, unknown> = {}
  if (settings.base.mergeCustomRules) {
    extraRules = (Array.isArray(base.rules) ? base.rules.map(String) : []).filter((r) => !/^\s*MATCH\s*,/i.test(r))
    extraProviders = (base['rule-providers'] as Record<string, unknown>) ?? {}
  }
  for (const k of GENERATED_KEYS) delete base[k]
  if (ignored.length)
    issues.push(
      settings.base.mergeCustomRules
        ? { level: 'INFO', code: 'base-merged' }
        : { level: 'INFO', code: 'base-overridden', params: { keys: ignored.join(', ') } },
    )
  return { base, extraRules, extraProviders }
}

/**
 * Full build pipeline (spec §33). Sources are already parsed, extracted, normalised and
 * fingerprinted at import time (steps 1–5); this runs steps 6–18 synchronously so the UI
 * can rebuild on every settings change.
 */
export function buildConfig(sources: Source[], settings: ProjectSettings): BuildResult {
  const issues: BuildIssue[] = []

  // Re-stamp source names: a rename must not require re-importing.
  const allNodes: ProxyNode[] = sources.flatMap((s) => s.nodes.map((n) => ({ ...n, sourceName: s.name })))

  // 6. deduplicate
  const { kept, removed } = deduplicateNodes(allNodes, settings.dedupeMode)
  if (removed.length) {
    const cross = removed.filter((r) => r.node.sourceId !== r.keptAs.sourceId).length
    issues.push(
      cross
        ? { level: 'INFO', code: 'dedupe-cross', params: { count: removed.length, cross } }
        : { level: 'INFO', code: 'dedupe', params: { count: removed.length } },
    )
  }

  // 7. display names, 8. regions
  const named = assignDisplayNames(kept)
  const nodes = classifyNodes(named, settings.regions, settings.regionOverrides)
  const unknown = nodes.filter((n) => n.warnings.some((w) => w.code === 'region-unknown')).length
  const ambiguous = nodes.filter((n) => n.warnings.some((w) => w.code === 'region-ambiguous')).length
  if (unknown) issues.push({ level: 'WARNING', code: 'region-unknown', params: { count: unknown } })
  if (ambiguous) issues.push({ level: 'WARNING', code: 'region-ambiguous', params: { count: ambiguous } })
  for (const bad of invalidPatterns(settings.regions))
    issues.push({ level: 'WARNING', code: 'region-pattern', params: { region: bad.regionId, pattern: bad.pattern } })

  const rejected = sources.reduce((sum, s) => sum + s.rejected.length, 0)
  if (rejected) issues.push({ level: 'INFO', code: 'rejected', params: { count: rejected } })
  for (const s of sources)
    if (!s.nodes.length) issues.push({ level: 'WARNING', code: 'empty-source', params: { name: s.name } })

  // 9–12. lines: everything, each region (merged across files), each file, advanced groups, single nodes
  const locale = settings.outputLocale ?? 'zh-CN'
  const ctx: StrategyContext = { nodes, sources, regions: settings.regions, settings: settings.strategy, locale }
  const strategies = [...generateCompositeGroups(ctx, issues), ...generateFilterGroups(ctx, issues)]
  const lineSet = buildLines({ nodes, sources, regions: settings.regions, settings: settings.strategy, locale, extra: strategies })

  // 13. one group per purpose
  const purposes = generatePurposeGroups(settings.purposes, lineSet, settings.strategy, issues, locale)

  // 14–15. rule providers and rules: LAN and mainland China direct, each purpose's services to its group
  const targets: Record<string, string> = { lan: 'DIRECT', china: 'DIRECT', ...purposeTargets(purposes) }
  const services = ALL_SERVICES.filter((s) => targets[s.id])
  const matchTarget = targets[FOREIGN_SERVICE_ID] ?? 'DIRECT'
  const ruleProviders = generateRuleProviders(
    services,
    settings.rules.mirror,
    settings.rules.downloadDirect ? 'DIRECT' : matchTarget,
  )
  const generatedRules = [...purposeDomainRules(purposes, issues), ...generateRules(services, targets, matchTarget)]

  // 16. base template
  const { base, extraRules, extraProviders } = resolveBaseTemplate(settings, issues)
  for (const name of Object.keys(extraProviders))
    if (name in ruleProviders)
      issues.push({ level: 'WARNING', code: 'provider-clash', params: { name } })

  const config: Record<string, unknown> = {
    ...base,
    proxies: nodes.map(toOutputProxy),
    'proxy-groups': [...purposes.map((p) => p.group), ...lineSet.groups],
    rules: [...extraRules, ...generatedRules],
    'rule-providers': { ...extraProviders, ...ruleProviders },
  }

  // 17. validate
  issues.push(...validateFinalConfig(config as Parameters<typeof validateFinalConfig>[0]))
  const ok = !hasErrors(issues)

  // 18. serialize
  const yaml = serializeConfig(config)

  return {
    config,
    yaml,
    nodes,
    strategies,
    business: [],
    lines: lineSet.lines,
    purposes,
    issues,
    ok,
    stats: {
      sources: sources.length,
      nodes: nodes.length,
      duplicates: removed.length,
      rejected,
      unknownRegion: unknown,
      regionStrategies: lineSet.lines.filter((l) => l.kind === 'region').length,
      sourceStrategies: lineSet.lines.filter((l) => l.kind === 'source').length,
      compositeStrategies: strategies.filter((s) => s.kind === 'composite').length,
      filterStrategies: strategies.filter((s) => s.kind === 'filter').length,
      businessStrategies: purposes.length,
      ruleProviders: Object.keys(config['rule-providers'] as object).length,
      rules: (config.rules as string[]).length,
    },
  }
}
