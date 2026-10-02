import { fingerprintNode } from '@/core/nodes'
import type { ProxyNode, Source } from '@/types'
import { sha256Hex, uid } from '@/utils/hash'
import { extractProxyNodes, parseSourceYaml, sourceNameFromFile, type ParseOptions } from './index'

export interface LoadSourceOptions extends ParseOptions {
  /** Keep the identity of an existing source when replacing its file. */
  existing?: Pick<Source, 'id' | 'name'>
  /** Display name override (defaults to the file name without extension). */
  name?: string
}

/**
 * Steps 1–5 of the pipeline for one file: parse YAML, extract `proxies`,
 * normalise, and fingerprint. Runs once per import; later settings changes
 * reuse the cached result instead of re-parsing (spec §37).
 */
export async function loadSourceFromText(
  text: string,
  fileName: string,
  options: LoadSourceOptions = {},
): Promise<Source> {
  const doc = parseSourceYaml(text)
  const { proxies, rejected } = extractProxyNodes(doc, options)
  const id = options.existing?.id ?? uid()
  const name = options.existing?.name ?? options.name ?? sourceNameFromFile(fileName)

  const nodes: ProxyNode[] = await Promise.all(
    proxies.map(async (raw) => ({
      sourceId: id,
      sourceName: name,
      originalName: String(raw.name),
      displayName: String(raw.name),
      raw,
      fingerprint: await fingerprintNode(raw),
      regionId: null,
      warnings: [],
    })),
  )

  return {
    id,
    name,
    originalFileName: fileName,
    importedAt: new Date().toISOString(),
    fileHash: await sha256Hex(text),
    nodes,
    rejected,
  }
}

export async function loadSourceFile(file: File, options: LoadSourceOptions = {}): Promise<Source> {
  return loadSourceFromText(await file.text(), file.name, options)
}

/** Rename a source without touching its id (spec §10). */
export function renameSource(source: Source, name: string): Source {
  return {
    ...source,
    name,
    nodes: source.nodes.map((n) => ({ ...n, sourceName: name })),
  }
}

export interface SourceDiff {
  oldCount: number
  newCount: number
  added: string[]
  removed: string[]
  renamed: { from: string; to: string }[]
}

/** Compare two snapshots of the same source by fingerprint (spec §8). */
export function diffSources(oldSource: Source, newSource: Source): SourceDiff {
  const oldByFp = new Map(oldSource.nodes.map((n) => [n.fingerprint, n]))
  const newByFp = new Map(newSource.nodes.map((n) => [n.fingerprint, n]))
  const added: string[] = []
  const renamed: SourceDiff['renamed'] = []
  for (const [fp, n] of newByFp) {
    const prev = oldByFp.get(fp)
    if (!prev) added.push(n.originalName)
    else if (prev.originalName !== n.originalName) renamed.push({ from: prev.originalName, to: n.originalName })
  }
  const removed = [...oldByFp].filter(([fp]) => !newByFp.has(fp)).map(([, n]) => n.originalName)
  return { oldCount: oldSource.nodes.length, newCount: newSource.nodes.length, added, removed, renamed }
}
