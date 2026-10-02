import type { MirrorId, RuleProviderDefinition } from '@/types'

/**
 * All rule sets come from MetaCubeX/meta-rules-dat (the rule data maintained by
 * the Mihomo team, generated from v2fly domain-list-community and geoip data).
 * Binary `.mrs` files are small and parse fast on routers.
 */
/**
 * Default is `testingcf` (jsDelivr behind Cloudflare): in a parallel burst of all 44 rule sets
 * it was the only host with no failures. Downloads go through the overseas group unless the
 * user opts into DIRECT (see `RulePresetSettings.downloadDirect`).
 */
export const MIRRORS: Record<MirrorId, { label: string; root: string }> = {
  testingcf: {
    label: 'jsDelivr (Cloudflare)',
    root: 'https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/',
  },
  jsdelivr: {
    label: 'jsDelivr CDN',
    root: 'https://cdn.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@meta/',
  },
  github: {
    label: 'GitHub Raw',
    root: 'https://github.com/MetaCubeX/meta-rules-dat/raw/meta/',
  },
}

export const DEFAULT_RULE_INTERVAL = 86400

/** Domain rule set from `geo/geosite/<site>.mrs`. Provider names may not contain `!`. */
export function geosite(site: string, name = site.replace(/!/g, 'not-')): RuleProviderDefinition {
  return {
    name,
    type: 'http',
    behavior: 'domain',
    format: 'mrs',
    path: `geo/geosite/${site}.mrs`,
    interval: DEFAULT_RULE_INTERVAL,
  }
}

/** IP rule set from `geo/geoip/<set>.mrs`. Rules pointing at it get `no-resolve`. */
export function geoip(set: string, name = `${set}_ip`): RuleProviderDefinition {
  return {
    name,
    type: 'http',
    behavior: 'ipcidr',
    format: 'mrs',
    path: `geo/geoip/${set}.mrs`,
    interval: DEFAULT_RULE_INTERVAL,
  }
}

export function providerUrl(def: RuleProviderDefinition, mirror: MirrorId): string {
  return MIRRORS[mirror].root + def.path
}
