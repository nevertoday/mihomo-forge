import { providerUrl } from '@/catalog/ruleProviders'
import type { MirrorId, RuleCategory, RuleService } from '@/types'

/** Strict emission order (spec §21). */
export const CATEGORY_ORDER: RuleCategory[] = [
  'lan',
  'block',
  'ai',
  'developer',
  'streaming',
  'social',
  'other',
  'china',
  'foreign',
]

/** Category first, then higher priority first. Gemini (ai) therefore always precedes Google (other). */
export function sortServicesForRules(services: RuleService[]): RuleService[] {
  return [...services].sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || b.priority - a.priority,
  )
}

export interface RuleProviderEntry {
  type: 'http'
  behavior: string
  format: string
  url: string
  path: string
  interval: number
  /**
   * Policy used to download the file. Without it Mihomo routes the download by its own rules,
   * and at boot (no rule set loaded yet) that is MATCH → whatever node was picked first.
   */
  proxy: string
}

/** `downloadPolicy` is the overseas group by default, or DIRECT when the user opts in. */
export function generateRuleProviders(
  services: RuleService[],
  mirror: MirrorId,
  downloadPolicy = 'DIRECT',
): Record<string, RuleProviderEntry> {
  const proxy = downloadPolicy
  const out: Record<string, RuleProviderEntry> = {}
  for (const service of sortServicesForRules(services)) {
    for (const def of service.ruleProviders) {
      if (out[def.name]) continue
      out[def.name] = {
        type: def.type,
        behavior: def.behavior,
        format: def.format,
        url: providerUrl(def, mirror),
        path: `./ruleset/${def.name}.${def.format}`,
        interval: def.interval,
        proxy,
      }
    }
  }
  return out
}

/**
 * `targets` maps service id -> policy name (a business group, or DIRECT/REJECT for fixed services).
 * Each provider is referenced once; the first (earliest) service wins.
 */
export function generateRules(services: RuleService[], targets: Record<string, string>, matchTarget: string): string[] {
  const rules: string[] = []
  const usedProviders = new Set<string>()
  for (const service of sortServicesForRules(services)) {
    const target = targets[service.id]
    if (!target) continue
    for (const raw of service.extraRules ?? []) rules.push(`${raw},${target}`)
    for (const def of service.ruleProviders) {
      if (usedProviders.has(def.name)) continue
      usedProviders.add(def.name)
      rules.push(`RULE-SET,${def.name},${target}${def.behavior === 'ipcidr' ? ',no-resolve' : ''}`)
    }
  }
  rules.push(`MATCH,${matchTarget}`)
  return rules
}
