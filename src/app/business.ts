import { BUILTIN_TARGETS, defaultBusinessSetting } from '@/core/strategies'
import { poolText, t } from '@/i18n'
import type { BusinessStrategySetting, BuildResult, ProjectSettings, RegionDefinition, RuleService, StrategyGroup } from '@/types'

export interface StrategyOption {
  ref: string
  name: string
  pool: string
}

export interface StrategyOptionGroup {
  id: 'region' | 'source' | 'composite' | 'filter' | 'general'
  label: string
  options: StrategyOption[]
}

/** Everything a business strategy may point at, grouped like spec §27. */
export function strategyOptionGroups(build: BuildResult, regions: RegionDefinition[]): StrategyOptionGroup[] {
  const by = (k: StrategyGroup['kind']) =>
    build.strategies.filter((s) => s.kind === k).map((s) => ({ ref: s.ref, name: s.group.name, pool: poolText(s.pool, regions) }))
  return [
    { id: 'region', label: t('service.groupRegion'), options: by('region') },
    { id: 'source', label: t('service.groupSource'), options: by('source') },
    { id: 'composite', label: t('service.groupComposite'), options: by('composite') },
    { id: 'filter', label: t('service.groupFilter'), options: by('filter') },
    {
      id: 'general',
      label: t('service.groupGeneral'),
      options: [
        ...by('global'),
        { ref: 'DIRECT', name: 'DIRECT', pool: t('pool.direct') },
        { ref: 'REJECT', name: 'REJECT', pool: t('pool.reject') },
      ],
    },
  ]
}

export function optionName(ref: string, build: BuildResult): string {
  if ((BUILTIN_TARGETS as readonly string[]).includes(ref)) return ref
  return build.strategies.find((s) => s.ref === ref)?.group.name ?? ref
}

/** The user's setting, or the catalog default resolved against what was built. */
export function currentSetting(service: RuleService, settings: ProjectSettings, build: BuildResult): BusinessStrategySetting {
  return settings.business[service.id] ?? defaultBusinessSetting(service, build.strategies)
}

/** Materialise a custom setting the first time the user edits a service. */
export function editableSetting(service: RuleService, settings: ProjectSettings, build: BuildResult): BusinessStrategySetting {
  if (!settings.business[service.id]) {
    const d = defaultBusinessSetting(service, build.strategies)
    settings.business[service.id] = { defaultRef: d.defaultRef, candidates: [...d.candidates] }
  }
  return settings.business[service.id]
}
