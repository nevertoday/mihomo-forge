// Core data model for Mihomo Forge. Everything here is plain data so the
// compiler stays a set of pure functions that can be tested without a browser.

export type RawProxy = Record<string, unknown>

/** UI languages; also the language used for generated group names. */
export type Locale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ar'

/** Interpolation values for a translatable message. The core never builds sentences itself. */
export type MessageParams = Record<string, string | number>

/** One imported YAML snapshot. Its identity (`id`) survives renames and file replacement. */
export interface Source {
  id: string
  name: string
  originalFileName: string
  importedAt: string
  fileHash: string
  nodes: ProxyNode[]
  /** Nodes that were skipped while extracting (missing fields, info nodes, ...). */
  rejected: RejectedNode[]
}

export interface RejectedNode {
  name: string
  code: 'not-object' | 'missing-fields' | 'info-node'
  params?: MessageParams
}

export interface NodeWarning {
  code: 'region-unknown' | 'region-ambiguous'
  /** region-ambiguous: `matches` (comma-separated region ids) and `chosen`. */
  params?: MessageParams
}

export interface ProxyNode {
  sourceId: string
  sourceName: string
  originalName: string
  displayName: string
  raw: RawProxy
  fingerprint: string
  regionId: string | null
  warnings: NodeWarning[]
}

export interface RegionDefinition {
  id: string
  label: string
  icon: string
  patterns: string[]
  priority: number
}

export type GroupMode = 'select' | 'url-test' | 'fallback'

export interface CompositeStrategy {
  id: string
  sourceId: string
  regionId: string
  mode: GroupMode
  displayName?: string
}

export type DedupeMode = 'none' | 'global' | 'source'

export type BasePreset = 'lite' | 'standard' | 'full' | 'custom'

export type ModuleId =
  | 'base'
  | 'ai'
  | 'developer'
  | 'streaming'
  | 'social'
  | 'gaming'
  | 'crypto'
  | 'ads'

export type RuleCategory =
  | 'lan'
  | 'block'
  | 'ai'
  | 'developer'
  | 'streaming'
  | 'social'
  | 'other'
  | 'china'
  | 'foreign'

export interface RuleProviderDefinition {
  /** Unique provider key used in `rule-providers` and `RULE-SET` rules. */
  name: string
  type: 'http'
  behavior: 'domain' | 'ipcidr' | 'classical'
  format: 'mrs' | 'yaml' | 'text'
  /** Path relative to the selected mirror root, e.g. `geo/geosite/openai.mrs`. */
  path: string
  interval: number
}

export interface RuleService {
  id: string
  label: string
  icon: string
  module: ModuleId
  category: RuleCategory
  ruleProviders: RuleProviderDefinition[]
  extraRules?: string[]
  /** Strategy references (see `StrategyRef`) offered by default, in order. First entry is the default. */
  defaultStrategyCandidates: string[]
  /** Higher priority emits earlier inside the same category. */
  priority: number
  /** Services the user cannot route elsewhere (LAN goes DIRECT, no group is generated). */
  fixedTarget?: 'DIRECT' | 'REJECT'
  /** Optional services are part of a module but off until the user enables them. */
  optional?: boolean
  /** Base services (LAN, China, Foreign) are always present. */
  required?: boolean
}

/**
 * A reference to a node strategy, stable across rebuilds:
 *   global:manual | global:auto | global:fallback
 *   region:<regionId>:manual | region:<regionId>:auto
 *   source:<sourceId> | source:<sourceId>:auto
 *   composite:<compositeId>
 *   DIRECT | REJECT
 * Catalog defaults may also use the tokens `regions:auto`, `regions:manual` and `sources:all`.
 */
export type StrategyRef = string

export interface BusinessStrategySetting {
  defaultRef: StrategyRef
  candidates: StrategyRef[]
}

export interface StrategySettings {
  globalManual: boolean
  globalAuto: boolean
  globalFallback: boolean
  byRegion: boolean
  bySource: boolean
  /** regionId -> enabled */
  enabledRegions: Record<string, boolean>
  /** regionId -> { manual, auto } */
  regionModes: Record<string, { manual: boolean; auto: boolean }>
  /** sourceId -> also generate a url-test group */
  sourceAuto: Record<string, boolean>
  composites: CompositeStrategy[]
  testUrl: string
  interval: number
  tolerance: number
}

export interface RulePresetSettings {
  preset: BasePreset
  modules: ModuleId[]
  /** Service ids switched on by the user on top of the preset and modules (e.g. optional services). */
  extraServices: string[]
  /** Service ids switched off by the user on top of the preset and modules. */
  disabledServices: string[]
  mirror: MirrorId
  /** Download rule sets over DIRECT instead of through the overseas group. */
  downloadDirect: boolean
}

export type MirrorId = 'jsdelivr' | 'github' | 'testingcf'

export interface BaseTemplateSettings {
  templateId: 'openclash-standard' | 'mihomo-generic' | 'custom'
  customYaml: string
  /** Keep rules / rule-providers from the custom base and place them first. */
  mergeCustomRules: boolean
}

export interface ProjectSettings {
  name: string
  /** Language of generated group names (`🇺🇸 美国自动` vs `🇺🇸 US Auto`). */
  outputLocale: Locale
  dedupeMode: DedupeMode
  excludeInfoNodes: boolean
  regions: RegionDefinition[]
  /** fingerprint -> regionId manual override */
  regionOverrides: Record<string, string>
  strategy: StrategySettings
  rules: RulePresetSettings
  business: Record<string, BusinessStrategySetting>
  base: BaseTemplateSettings
}

export type IssueLevel = 'ERROR' | 'WARNING' | 'INFO'

export type IssueCode =
  | 'base-yaml-parse'
  | 'base-yaml-shape'
  | 'base-overridden'
  | 'base-merged'
  | 'dedupe'
  | 'dedupe-cross'
  | 'region-unknown'
  | 'region-ambiguous'
  | 'region-pattern'
  | 'rejected'
  | 'empty-source'
  | 'provider-clash'
  | 'composite-orphan'
  | 'composite-empty'
  | 'candidate-removed'
  | 'default-missing'
  | 'no-candidates'
  | 'no-proxies'
  | 'dup-proxy'
  | 'dup-group'
  | 'name-clash'
  | 'reserved-name'
  | 'empty-group'
  | 'missing-ref'
  | 'self-ref'
  | 'missing-provider'
  | 'rule-target'
  | 'match-target'
  | 'match-position'
  | 'rule-syntax'
  | 'missing-rule-provider'
  | 'provider-proxy'
  | 'no-match'
  | 'unused-provider'

/** A build finding. Text is produced by the UI from `code` + `params` in the viewer's language. */
export interface BuildIssue {
  level: IssueLevel
  code: IssueCode
  params?: MessageParams
}

/** What a node-strategy group contains, for explanations in the UI. */
export interface PoolInfo {
  kind: 'all' | 'region' | 'source' | 'composite'
  count: number
  regionId?: string
  sourceName?: string
}

export interface ProxyGroup {
  name: string
  type: GroupMode
  proxies: string[]
  url?: string
  interval?: number
  tolerance?: number
}

/** A generated node-strategy group plus the metadata the UI needs to explain it. */
export interface StrategyGroup {
  ref: StrategyRef
  kind: 'global' | 'region' | 'source' | 'composite'
  group: ProxyGroup
  pool: PoolInfo
  nodeCount: number
}

export interface BusinessGroup {
  service: RuleService
  group: ProxyGroup
  defaultRef: StrategyRef
  candidateRefs: StrategyRef[]
}

export interface BuildStats {
  sources: number
  nodes: number
  duplicates: number
  rejected: number
  unknownRegion: number
  regionStrategies: number
  sourceStrategies: number
  compositeStrategies: number
  businessStrategies: number
  ruleProviders: number
  rules: number
}

export interface BuildResult {
  config: Record<string, unknown>
  yaml: string
  nodes: ProxyNode[]
  strategies: StrategyGroup[]
  business: BusinessGroup[]
  issues: BuildIssue[]
  stats: BuildStats
  ok: boolean
}
