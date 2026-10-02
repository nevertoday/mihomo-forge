import type { DedupeMode, ProxyNode, RawProxy } from '@/types'
import { sha256Hex, stableStringify } from '@/utils/hash'

/**
 * Fields that identify a node's actual endpoint. `name`, source prefix and UI
 * metadata are ignored, so the same server shipped by two airports under
 * different names is still recognised as a duplicate (spec §13).
 */
export const FINGERPRINT_FIELDS = [
  'type',
  'server',
  'port',
  'uuid',
  'password',
  'username',
  'network',
  'tls',
  'servername',
  'sni',
  'ws-opts',
  'grpc-opts',
  'reality-opts',
  'client-fingerprint',
] as const

export function fingerprintPayload(raw: RawProxy): string {
  const picked: Record<string, unknown> = {}
  for (const key of FINGERPRINT_FIELDS) {
    let value = raw[key]
    if (value === undefined || value === null) continue
    if (key === 'server' && typeof value === 'string') value = value.trim().toLowerCase()
    if (key === 'port') value = Number(value)
    picked[key] = value
  }
  return stableStringify(picked)
}

export async function fingerprintNode(raw: RawProxy): Promise<string> {
  return sha256Hex(fingerprintPayload(raw))
}

export interface DedupeResult {
  kept: ProxyNode[]
  removed: { node: ProxyNode; keptAs: ProxyNode }[]
}

/**
 * Drop nodes whose fingerprint was already seen. Input order is import order, so
 * the first imported source wins across sources (spec §13).
 */
export function deduplicateNodes(nodes: ProxyNode[], mode: DedupeMode): DedupeResult {
  if (mode === 'none') return { kept: [...nodes], removed: [] }
  const seen = new Map<string, ProxyNode>()
  const kept: ProxyNode[] = []
  const removed: DedupeResult['removed'] = []
  for (const node of nodes) {
    const key = mode === 'global' ? node.fingerprint : `${node.sourceId}\u0000${node.fingerprint}`
    const first = seen.get(key)
    if (first) {
      removed.push({ node, keptAs: first })
      continue
    }
    seen.set(key, node)
    kept.push(node)
  }
  return { kept, removed }
}

/**
 * `[来源名] 原节点名`. Repeated names inside a source get ` #2`, ` #3` in YAML order.
 * Never invents `[A]` / `[B]` labels (spec §12).
 */
export function assignDisplayNames(nodes: ProxyNode[], reserved: Iterable<string> = []): ProxyNode[] {
  const used = new Set<string>(reserved)
  return nodes.map((node) => {
    const base = `[${node.sourceName}] ${node.originalName}`
    let name = base
    let n = 1
    while (used.has(name)) {
      n += 1
      name = `${base} #${n}`
    }
    used.add(name)
    return { ...node, displayName: name }
  })
}

/** Final proxy object for the YAML: raw fields with the display name first. */
export function toOutputProxy(node: ProxyNode): RawProxy {
  const { name: _ignored, ...rest } = node.raw
  return { name: node.displayName, ...rest }
}
