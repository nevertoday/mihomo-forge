import type { ProjectSettings, ProxyNode, Source } from '@/types'
import { normalizeSettings } from './defaults'

export const PROJECT_FILE_VERSION = 1
export const PROJECT_FILE_NAME = 'mihomo-forge-project.json'

export interface ProjectFileSource {
  id: string
  name: string
  expectedFileName: string
  /** Only present when the user explicitly opted in to exporting node credentials. */
  nodes?: ProxyNode[]
  importedAt?: string
  fileHash?: string
}

export interface ProjectFile {
  version: number
  app: 'mihomo-forge'
  exportedAt: string
  includesNodes: boolean
  sources: ProjectFileSource[]
  settings: ProjectSettings
}

/** Node credentials (uuid / password / server) are excluded unless `includeNodes` is set (spec §31). */
export function exportProject(settings: ProjectSettings, sources: Source[], includeNodes = false): ProjectFile {
  return {
    version: PROJECT_FILE_VERSION,
    app: 'mihomo-forge',
    exportedAt: new Date().toISOString(),
    includesNodes: includeNodes,
    sources: sources.map((s) => ({
      id: s.id,
      name: s.name,
      expectedFileName: s.originalFileName,
      ...(includeNodes ? { nodes: s.nodes, importedAt: s.importedAt, fileHash: s.fileHash } : {}),
    })),
    settings,
  }
}

export class ProjectFileError extends Error {
  constructor(
    readonly code: 'invalid-json' | 'not-project' | 'too-new',
    readonly params: Record<string, string | number> = {},
  ) {
    super(code)
    this.name = 'ProjectFileError'
  }
}

/** Sources without nodes come back as empty placeholders waiting for their YAML file. */
export function importProject(json: string): { settings: ProjectSettings; sources: Source[] } {
  let data: Partial<ProjectFile>
  try {
    data = JSON.parse(json)
  } catch {
    throw new ProjectFileError('invalid-json')
  }
  if (!data || typeof data !== 'object' || typeof data.version !== 'number') {
    throw new ProjectFileError('not-project')
  }
  if (data.version > PROJECT_FILE_VERSION) {
    throw new ProjectFileError('too-new', { version: data.version })
  }
  const sources: Source[] = (data.sources ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    originalFileName: s.expectedFileName,
    importedAt: s.importedAt ?? '',
    fileHash: s.fileHash ?? '',
    nodes: (s.nodes ?? []).map((n) => ({ ...n, sourceId: s.id, sourceName: s.name })),
    rejected: [],
  }))
  return { settings: normalizeSettings(data.settings), sources }
}
