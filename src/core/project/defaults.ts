import { DEFAULT_ENABLED_REGION_IDS, DEFAULT_REGIONS } from '@/catalog/regions'
import type { Locale, ProjectSettings, RegionDefinition } from '@/types'

export function cloneRegions(regions: RegionDefinition[] = DEFAULT_REGIONS): RegionDefinition[] {
  return regions.map((r) => ({ ...r, patterns: [...r.patterns] }))
}

const DEFAULT_PROJECT_NAME: Record<Locale, string> = {
  'zh-CN': '我的 OpenClash',
  'zh-TW': '我的 OpenClash',
  en: 'My OpenClash',
  ja: 'マイ OpenClash',
  ar: 'إعدادات OpenClash',
}

export const isDefaultProjectName = (name: string) => Object.values(DEFAULT_PROJECT_NAME).includes(name)

/** Defaults from spec §7: all node strategies on, Standard + AI + Developer, global dedupe. */
export function createDefaultSettings(locale: Locale = 'zh-CN'): ProjectSettings {
  const regions = cloneRegions()
  return {
    name: DEFAULT_PROJECT_NAME[locale],
    outputLocale: locale,
    dedupeMode: 'global',
    excludeInfoNodes: true,
    regions,
    regionOverrides: {},
    strategy: {
      globalManual: true,
      globalAuto: true,
      globalFallback: true,
      byRegion: true,
      bySource: true,
      enabledRegions: Object.fromEntries(regions.map((r) => [r.id, DEFAULT_ENABLED_REGION_IDS.includes(r.id)])),
      regionModes: Object.fromEntries(regions.map((r) => [r.id, { manual: true, auto: true }])),
      sourceAuto: {},
      composites: [],
      filters: [],
      testUrl: 'https://www.gstatic.com/generate_204',
      interval: 300,
      tolerance: 50,
    },
    rules: {
      preset: 'standard',
      modules: ['ai', 'developer'],
      extraServices: [],
      disabledServices: [],
      mirror: 'testingcf',
      downloadDirect: false,
    },
    business: {},
    base: {
      templateId: 'openclash-standard',
      customYaml: '',
      mergeCustomRules: false,
    },
  }
}

/** Fill gaps left by older project files so new fields always have a value. */
export function normalizeSettings(input: Partial<ProjectSettings> | undefined): ProjectSettings {
  const d = createDefaultSettings()
  if (!input) return d
  const regions = input.regions?.length ? cloneRegions(input.regions) : d.regions
  return {
    ...d,
    ...input,
    regions,
    regionOverrides: { ...(input.regionOverrides ?? {}) },
    strategy: {
      ...d.strategy,
      ...input.strategy,
      enabledRegions: { ...d.strategy.enabledRegions, ...input.strategy?.enabledRegions },
      regionModes: { ...d.strategy.regionModes, ...input.strategy?.regionModes },
      sourceAuto: { ...input.strategy?.sourceAuto },
      composites: [...(input.strategy?.composites ?? [])],
      filters: [...(input.strategy?.filters ?? [])],
    },
    rules: { ...d.rules, ...input.rules },
    business: { ...(input.business ?? {}) },
    base: { ...d.base, ...input.base },
  }
}
