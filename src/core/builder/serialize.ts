import { Document, isScalar, visit } from 'yaml'

/** Readable key order (spec §36). Keys not listed keep their base-template order before `dns`. */
const TAIL_ORDER = ['dns', 'tun', 'sniffer', 'profile', 'proxies', 'proxy-groups', 'rules', 'rule-providers']

export function orderConfigKeys(config: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(config)) if (!TAIL_ORDER.includes(k)) out[k] = v
  for (const k of TAIL_ORDER) if (k in config) out[k] = config[k]
  return out
}

/**
 * UTF-8, emoji kept literal, 2-space indent, no `!!js` tags, no anchors/aliases
 * (shared objects in templates must not turn into `&a1` / `*a1`).
 *
 * Written with YAML 1.1 quoting rules: OpenClash re-reads and rewrites the config with
 * Ruby (YAML 1.1), where a bare `off` / `yes` / `on` / `n` becomes a boolean and `0755`
 * an octal. Quoting those keeps the file identical for Ruby (1.1) and Mihomo (1.2);
 * otherwise `find-process-mode: off` turns into `false` and Mihomo refuses to start.
 */
export function serializeConfig(config: Record<string, unknown>): string {
  const doc = new Document(orderConfigKeys(config), { version: '1.1', aliasDuplicateObjects: false })
  // Ruby reads a plain `:abc` as a Symbol, which OpenClash's safe loader rejects.
  visit(doc, {
    Scalar(_, node) {
      if (typeof node.value === 'string' && node.value.startsWith(':')) node.type = 'QUOTE_DOUBLE'
    },
    Pair(_, pair) {
      if (isScalar(pair.key) && typeof pair.key.value === 'string' && pair.key.value.startsWith(':')) pair.key.type = 'QUOTE_DOUBLE'
    },
  })
  return doc.toString({ indent: 2, lineWidth: 0 })
}
