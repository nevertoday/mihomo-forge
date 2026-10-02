import { parse } from 'yaml'
import type { MessageParams, RawProxy, RejectedNode } from '@/types'

export type SourceParseErrorCode = 'yaml' | 'not-object' | 'no-proxies' | 'not-array' | 'empty'

/** Thrown for unusable files. The UI turns `code` + `params` into a message in the viewer's language. */
export class SourceParseError extends Error {
  constructor(
    readonly code: SourceParseErrorCode,
    readonly params: MessageParams = {},
  ) {
    super(code + (params.detail ? `: ${params.detail}` : ''))
    this.name = 'SourceParseError'
  }
}

export interface ParsedSource {
  proxies: RawProxy[]
  rejected: RejectedNode[]
  /** Top-level keys that were present but deliberately ignored (proxy-groups, rules, dns ...). */
  ignoredKeys: string[]
}

export interface ParseOptions {
  /** Drop "剩余流量 / 到期时间 / 官网" style placeholder nodes. */
  excludeInfoNodes?: boolean
}

/** Placeholder nodes airports put into subscriptions to display account info. */
export const INFO_NODE_PATTERN =
  /剩余流量|已用流量|总流量|剩余|剩餘|到期|过期|過期|有效期|官网|官網|网址|網址|套餐|重置|距离下次|距離下次|续费|續費|残り|有効期限|Expire|Traffic\s*:|Remaining|官方|客服|频道|頻道|群组|群組/i

const REQUIRED_FIELDS = ['name', 'type', 'server', 'port'] as const

/** Parse YAML text. Throws `SourceParseError`. */
export function parseSourceYaml(text: string): unknown {
  if (!text.trim()) throw new SourceParseError('empty')
  try {
    // `uniqueKeys: false` tolerates sloppy airport exports with repeated keys.
    return parse(text, { uniqueKeys: false, maxAliasCount: -1 })
  } catch (err) {
    const detail = err instanceof Error ? err.message.split('\n')[0] : String(err)
    throw new SourceParseError('yaml', { detail })
  }
}

/**
 * Only `proxies` is taken from a snapshot. The airport's own proxy-groups, rules,
 * dns and rule-providers are always ignored (spec §9, §43.1).
 */
export function extractProxyNodes(doc: unknown, options: ParseOptions = {}): ParsedSource {
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new SourceParseError('not-object')
  }
  const record = doc as Record<string, unknown>
  if (!('proxies' in record) || record.proxies == null) {
    throw new SourceParseError('no-proxies')
  }
  if (!Array.isArray(record.proxies)) {
    throw new SourceParseError('not-array')
  }

  const ignoredKeys = Object.keys(record).filter((k) => k !== 'proxies')
  const proxies: RawProxy[] = []
  const rejected: RejectedNode[] = []

  record.proxies.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      rejected.push({ name: `#${index + 1}`, code: 'not-object' })
      return
    }
    const node = normalizeNode(item as RawProxy)
    const label = typeof node.name === 'string' && node.name ? node.name : `#${index + 1}`
    const missing = REQUIRED_FIELDS.filter((f) => node[f] === undefined || node[f] === null || node[f] === '')
    if (missing.length) {
      rejected.push({ name: label, code: 'missing-fields', params: { fields: missing.join(', ') } })
      return
    }
    if (options.excludeInfoNodes && INFO_NODE_PATTERN.test(label)) {
      rejected.push({ name: label, code: 'info-node' })
      return
    }
    proxies.push(node)
  })

  return { proxies, rejected, ignoredKeys }
}

/** Trim the name and coerce a numeric-string port. Everything else is kept verbatim. */
export function normalizeNode(raw: RawProxy): RawProxy {
  const node: RawProxy = { ...raw }
  if (typeof node.name === 'number') node.name = String(node.name)
  if (typeof node.name === 'string') node.name = node.name.trim()
  if (typeof node.port === 'string' && /^\d+$/.test(node.port.trim())) node.port = Number(node.port.trim())
  return node
}

/** `奶昔.yaml` -> `奶昔`. */
export function sourceNameFromFile(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? fileName
  return base.replace(/\.(ya?ml|txt|conf)$/i, '').trim() || base
}
