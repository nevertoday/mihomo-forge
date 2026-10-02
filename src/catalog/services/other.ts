import type { RuleService } from '@/types'
import { geoip, geosite } from '../ruleProviders'

const GENERAL_CANDIDATES = ['global:auto', 'regions:auto', 'sources:all', 'global:manual', 'DIRECT']
/** Services that usually work fine from mainland China: DIRECT first. */
const DIRECT_FIRST = ['DIRECT', 'global:auto', 'regions:auto', 'sources:all', 'global:manual']

/** Standard-preset services that don't belong to an optional module. Category `other` (spec §21 step 7). */
export const generalServices: RuleService[] = [
  {
    id: 'google',
    label: 'Google',
    icon: '🔍',
    module: 'base',
    category: 'other',
    ruleProviders: [geosite('google'), geoip('google')],
    defaultStrategyCandidates: GENERAL_CANDIDATES,
    priority: 100,
  },
  {
    id: 'microsoft',
    label: 'Microsoft',
    icon: '🪟',
    module: 'base',
    category: 'other',
    ruleProviders: [geosite('microsoft')],
    defaultStrategyCandidates: DIRECT_FIRST,
    priority: 90,
  },
  {
    id: 'apple',
    label: 'Apple',
    icon: '🍎',
    module: 'base',
    category: 'other',
    ruleProviders: [geosite('apple')],
    defaultStrategyCandidates: DIRECT_FIRST,
    priority: 89,
  },
]

export const gamingServices: RuleService[] = [
  {
    id: 'steam',
    label: 'Steam',
    icon: '🚂',
    module: 'gaming',
    category: 'other',
    ruleProviders: [geosite('steam')],
    defaultStrategyCandidates: DIRECT_FIRST,
    priority: 80,
  },
  {
    id: 'epic',
    label: 'Epic Games',
    icon: '🕹️',
    module: 'gaming',
    category: 'other',
    ruleProviders: [geosite('epicgames')],
    defaultStrategyCandidates: DIRECT_FIRST,
    priority: 79,
  },
  {
    id: 'playstation',
    label: 'PlayStation',
    icon: '🎮',
    module: 'gaming',
    category: 'other',
    ruleProviders: [geosite('playstation')],
    defaultStrategyCandidates: DIRECT_FIRST,
    priority: 78,
    optional: true,
  },
]

export const cryptoServices: RuleService[] = [
  {
    id: 'binance',
    label: 'Binance',
    icon: '🪙',
    module: 'crypto',
    category: 'other',
    ruleProviders: [geosite('binance')],
    defaultStrategyCandidates: ['region:jp:auto', 'region:sg:auto', ...GENERAL_CANDIDATES.filter((c) => c !== 'DIRECT')],
    priority: 70,
  },
  {
    id: 'okx',
    label: 'OKX',
    icon: '💱',
    module: 'crypto',
    category: 'other',
    ruleProviders: [geosite('okx')],
    defaultStrategyCandidates: ['region:jp:auto', 'region:sg:auto', ...GENERAL_CANDIDATES.filter((c) => c !== 'DIRECT')],
    priority: 69,
  },
]

export const adsServices: RuleService[] = [
  {
    id: 'ads',
    label: '广告拦截',
    icon: '🛑',
    module: 'ads',
    category: 'block',
    ruleProviders: [geosite('category-ads-all')],
    defaultStrategyCandidates: ['REJECT', 'DIRECT'],
    priority: 100,
  },
]
