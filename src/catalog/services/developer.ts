import type { RuleService } from '@/types'
import { geosite } from '../ruleProviders'

const DEV_CANDIDATES = ['global:auto', 'regions:auto', 'sources:all', 'global:manual', 'DIRECT']

export const developerServices: RuleService[] = [
  {
    id: 'github',
    label: 'GitHub',
    icon: '🐙',
    module: 'developer',
    category: 'developer',
    ruleProviders: [geosite('github')],
    defaultStrategyCandidates: DEV_CANDIDATES,
    priority: 100,
  },
  {
    id: 'gitlab',
    label: 'GitLab',
    icon: '🦊',
    module: 'developer',
    category: 'developer',
    ruleProviders: [geosite('gitlab')],
    defaultStrategyCandidates: DEV_CANDIDATES,
    priority: 99,
  },
  {
    id: 'docker',
    label: 'Docker',
    icon: '🐳',
    module: 'developer',
    category: 'developer',
    ruleProviders: [geosite('docker')],
    defaultStrategyCandidates: DEV_CANDIDATES,
    priority: 98,
  },
]
