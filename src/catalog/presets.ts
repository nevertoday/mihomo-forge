import type { BasePreset, ModuleId, RulePresetSettings, RuleService } from '@/types'
import { ALL_SERVICES, MODULES, SERVICE_BY_ID, servicesOfModule } from './services'

export interface PresetInfo {
  id: BasePreset
  label: string
}

/** Descriptions live in the i18n messages (`presets.<id>`). */
export const PRESETS: PresetInfo[] = [
  { id: 'lite', label: 'Lite' },
  { id: 'standard', label: 'Standard' },
  { id: 'full', label: 'Full' },
  { id: 'custom', label: 'Custom' },
]

const LITE = ['lan', 'china', 'foreign']
const STANDARD = [...LITE, 'google', 'github', 'telegram', 'youtube', 'netflix', 'apple', 'microsoft']

/** Service ids a preset contributes before modules and manual toggles are applied. */
export function presetServiceIds(preset: BasePreset): string[] {
  switch (preset) {
    case 'lite':
    case 'custom':
      return LITE
    case 'standard':
      return STANDARD
    case 'full':
      // Full is assembled from every module instead of a separately maintained list (spec §18).
      return [
        ...STANDARD,
        ...MODULES.flatMap((m) => servicesOfModule(m.id))
          .filter((s) => !s.optional)
          .map((s) => s.id),
      ]
  }
}

/** Modules switched on by Full. Ads stays opt-in because blocking can break sites. */
export const FULL_MODULES: ModuleId[] = ['ai', 'developer', 'streaming', 'social', 'gaming', 'crypto']

/**
 * Resolve the enabled services:
 *   preset ∪ non-optional services of enabled modules ∪ extraServices − disabledServices.
 * Required base services can never be removed.
 */
export function resolveServices(settings: RulePresetSettings): RuleService[] {
  const ids = new Set<string>(presetServiceIds(settings.preset))
  for (const module of settings.modules) {
    for (const s of servicesOfModule(module)) if (!s.optional) ids.add(s.id)
  }
  for (const id of settings.extraServices) ids.add(id)
  for (const id of settings.disabledServices) {
    if (!SERVICE_BY_ID[id]?.required) ids.delete(id)
  }
  // Keep catalog order so the UI is stable; rule order is decided later by category/priority.
  return ALL_SERVICES.filter((s) => ids.has(s.id))
}
