import { OTHER_REGION_ID } from '@/catalog/regions'
import type { ProxyNode, RegionDefinition } from '@/types'

interface CompiledRegion {
  region: RegionDefinition
  regexes: RegExp[]
}

// Keyed by content, not identity: the UI edits pattern arrays in place.
let cacheKey = ''
let cacheValue: CompiledRegion[] = []

/** Compile region patterns once per distinct region list. Invalid user patterns are skipped, not thrown. */
export function compileRegions(regions: RegionDefinition[]): CompiledRegion[] {
  const key = JSON.stringify(regions.map((r) => [r.id, r.priority, r.patterns]))
  if (key === cacheKey) return cacheValue
  const compiled = regions
    .filter((r) => r.id !== OTHER_REGION_ID)
    .map((region) => ({
      region,
      regexes: region.patterns.flatMap((p) => {
        try {
          return [new RegExp(p, 'iu')]
        } catch {
          return []
        }
      }),
    }))
    .sort((a, b) => b.region.priority - a.region.priority)
  cacheKey = key
  cacheValue = compiled
  return compiled
}

export function invalidPatterns(regions: RegionDefinition[]): { regionId: string; pattern: string }[] {
  const bad: { regionId: string; pattern: string }[] = []
  for (const r of regions) {
    for (const p of r.patterns) {
      try {
        new RegExp(p, 'iu')
      } catch {
        bad.push({ regionId: r.id, pattern: p })
      }
    }
  }
  return bad
}

export interface RegionMatch {
  regionId: string
  /** Every region that matched, highest priority first. */
  matches: string[]
}

/** Classify by the ORIGINAL node name; the `[来源]` prefix must never influence the result (spec §14). */
export function classifyRegion(originalName: string, regions: RegionDefinition[]): RegionMatch {
  const matches: string[] = []
  for (const { region, regexes } of compileRegions(regions)) {
    if (regexes.some((re) => re.test(originalName))) matches.push(region.id)
  }
  return { regionId: matches[0] ?? OTHER_REGION_ID, matches }
}

/** Assign `regionId` and attach warnings for unknown / ambiguous names. Manual overrides win. */
export function classifyNodes(
  nodes: ProxyNode[],
  regions: RegionDefinition[],
  overrides: Record<string, string> = {},
): ProxyNode[] {
  return nodes.map((node) => {
    const warnings = node.warnings.filter((w) => !w.code.startsWith('region-'))
    const override = overrides[node.fingerprint]
    if (override && regions.some((r) => r.id === override)) {
      return { ...node, regionId: override, warnings }
    }
    const { regionId, matches } = classifyRegion(node.originalName, regions)
    if (matches.length === 0) warnings.push({ code: 'region-unknown' })
    else if (matches.length > 1)
      warnings.push({ code: 'region-ambiguous', params: { matches: matches.join(','), chosen: regionId } })
    return { ...node, regionId, warnings }
  })
}
