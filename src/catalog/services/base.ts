import type { RuleService } from '@/types'
import { geoip, geosite } from '../ruleProviders'

export const FOREIGN_SERVICE_ID = 'foreign'

/** LAN, China and Foreign are present in every preset. */
export const baseServices: RuleService[] = [
  {
    id: 'lan',
    label: '局域网',
    icon: '🏠',
    module: 'base',
    category: 'lan',
    ruleProviders: [geosite('private'), geoip('private')],
    defaultStrategyCandidates: ['DIRECT'],
    priority: 100,
    fixedTarget: 'DIRECT',
    required: true,
  },
  {
    id: 'china',
    label: '国内',
    icon: '🇨🇳',
    module: 'base',
    category: 'china',
    ruleProviders: [geosite('cn'), geoip('cn')],
    defaultStrategyCandidates: ['DIRECT', 'global:manual', 'global:auto'],
    priority: 100,
    required: true,
  },
  {
    id: FOREIGN_SERVICE_ID,
    label: '国外',
    icon: '🌐',
    module: 'base',
    category: 'foreign',
    ruleProviders: [geosite('geolocation-!cn')],
    defaultStrategyCandidates: [
      'global:auto',
      'global:manual',
      'global:fallback',
      'regions:auto',
      'sources:all',
      'DIRECT',
    ],
    priority: 100,
    required: true,
  },
]
