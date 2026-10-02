import type { ModuleId, RuleService } from '@/types'
import { aiServices } from './ai'
import { baseServices } from './base'
import { developerServices } from './developer'
import { adsServices, cryptoServices, gamingServices, generalServices } from './other'
import { socialServices } from './social'
import { streamingServices } from './streaming'

export { FOREIGN_SERVICE_ID } from './base'

export const ALL_SERVICES: RuleService[] = [
  ...baseServices,
  ...generalServices,
  ...adsServices,
  ...aiServices,
  ...developerServices,
  ...streamingServices,
  ...socialServices,
  ...gamingServices,
  ...cryptoServices,
]

export const SERVICE_BY_ID: Record<string, RuleService> = Object.fromEntries(
  ALL_SERVICES.map((s) => [s.id, s]),
)

export interface ModuleInfo {
  id: ModuleId
  label: string
}

/** Optional add-on modules shown in the rule page (spec §26). `base` is always on. Descriptions: i18n `modules.<id>`. */
export const MODULES: ModuleInfo[] = [
  { id: 'ai', label: 'AI' },
  { id: 'developer', label: 'Developer' },
  { id: 'streaming', label: 'Streaming' },
  { id: 'social', label: 'Social' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'ads', label: 'Ads' },
]

export function servicesOfModule(module: ModuleId): RuleService[] {
  return ALL_SERVICES.filter((s) => s.module === module)
}
