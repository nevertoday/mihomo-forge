import { defineStore } from 'pinia'
import { computed, markRaw, reactive, ref, shallowRef, watch } from 'vue'
import { buildConfig } from '@/core/builder'
import { SourceParseError, sourceNameFromFile } from '@/core/parser'
import { diffSources, loadSourceFile, renameSource, type SourceDiff } from '@/core/parser/loadSource'
import { createDefaultSettings, normalizeSettings } from '@/core/project/defaults'
import { exportProject, importProject, PROJECT_FILE_NAME, ProjectFileError } from '@/core/project/projectFile'
import { locale, t, tDynamic } from '@/i18n'
import type { ProjectSettings, Source } from '@/types'
import { downloadText } from '@/utils/download'
import { idbDelete, idbGet, idbSet } from '@/utils/idb'

export type ViewId = 'overview' | 'sources' | 'strategies' | 'rules' | 'base' | 'build'

export interface PendingReplacement {
  existing: Source
  incoming: Source
  diff: SourceDiff
}

export interface Toast {
  id: number
  tone: 'info' | 'success' | 'warning' | 'error'
  text: string
}

interface StoredProject {
  settings: ProjectSettings
  sources: Source[]
  savedAt: string
}

const STORAGE_KEY = 'project'

/** Strip Vue proxies so values can go through structured clone (IndexedDB) and JSON. */
const plain = <T>(v: T): T => JSON.parse(JSON.stringify(v))

export const useProjectStore = defineStore('project', () => {
  const settings = reactive<ProjectSettings>(createDefaultSettings(locale.value))
  // Parsed sources can hold thousands of nodes: keep them out of deep reactivity (spec §37).
  const sources = shallowRef<Source[]>([])
  const pending = ref<PendingReplacement[]>([])
  const toasts = ref<Toast[]>([])
  const savedSignature = ref('')
  const savedAt = ref<string | null>(null)
  const ready = ref(false)
  const hasSavedProject = ref(false)

  const build = computed(() => buildConfig(sources.value, settings))
  const nodeCount = computed(() => build.value.stats.nodes)
  const signature = computed(() =>
    JSON.stringify({ settings, sources: sources.value.map((s) => [s.id, s.name, s.fileHash]) }),
  )
  const dirty = computed(() => ready.value && signature.value !== savedSignature.value)

  let toastSeq = 0
  function notify(text: string, tone: Toast['tone'] = 'info') {
    const id = ++toastSeq
    toasts.value = [...toasts.value, { id, tone, text }]
    setTimeout(() => (toasts.value = toasts.value.filter((t) => t.id !== id)), tone === 'error' ? 7000 : 3600)
  }

  function setSources(next: Source[]) {
    sources.value = next.map((s) => markRaw(s))
  }

  function findMatch(fileName: string): Source | undefined {
    const name = sourceNameFromFile(fileName)
    return sources.value.find((s) => s.originalFileName === fileName || s.name === name)
  }

  /** Import dropped files. Files matching an existing source become pending replacements with a diff. */
  async function importFiles(files: File[]) {
    const yamlFiles = files.filter((f) => /\.(ya?ml|txt)$/i.test(f.name))
    if (yamlFiles.length < files.length) notify(t('toast.ignoredFiles', { n: files.length - yamlFiles.length }), 'warning')
    let added = 0
    for (const file of yamlFiles) {
      const existing = findMatch(file.name)
      try {
        const incoming = await loadSourceFile(file, {
          excludeInfoNodes: settings.excludeInfoNodes,
          existing: existing ? { id: existing.id, name: existing.name } : undefined,
        })
        if (existing && existing.nodes.length === 0) {
          // A placeholder restored from a project file: just fill it.
          setSources(sources.value.map((s) => (s.id === existing.id ? incoming : s)))
          added++
        } else if (existing) {
          pending.value = [...pending.value, { existing, incoming, diff: diffSources(existing, incoming) }]
        } else {
          setSources([...sources.value, incoming])
          added++
        }
      } catch (err) {
        const message =
          err instanceof SourceParseError
            ? tDynamic(`parseError.${err.code}`, err.params)
            : t('toast.readFailed', { detail: (err as Error).message })
        notify(t('toast.fileError', { file: file.name, message }), 'error')
      }
    }
    if (added) notify(t('toast.imported', { n: added }), 'success')
  }

  /** Replace only that source; every rule, region, business and combo setting is kept (spec §8). */
  function resolvePending(action: 'replace' | 'add' | 'skip') {
    const [first, ...rest] = pending.value
    if (!first) return
    pending.value = rest
    if (action === 'replace') {
      setSources(sources.value.map((s) => (s.id === first.existing.id ? first.incoming : s)))
      notify(t('toast.replaced', { name: first.existing.name }), 'success')
    } else if (action === 'add') {
      const base = `${first.incoming.name}${t('toast.newSourceSuffix')}`
      let name = base
      let n = 2
      while (sources.value.some((s) => s.name === name)) name = `${base} ${n++}`
      const fresh = { ...renameSource(first.incoming, name), id: crypto.randomUUID() }
      fresh.nodes = fresh.nodes.map((node) => ({ ...node, sourceId: fresh.id }))
      setSources([...sources.value, fresh])
    }
  }

  function renameSourceById(id: string, name: string): string | null {
    const clean = name.trim()
    if (!clean) return t('sourceCard.errEmpty')
    if (/[[\]]/.test(clean)) return t('sourceCard.errBrackets')
    if (sources.value.some((s) => s.id !== id && s.name === clean)) return t('sourceCard.errDuplicate')
    setSources(sources.value.map((s) => (s.id === id ? renameSource(s, clean) : s)))
    return null
  }

  function removeSource(id: string) {
    setSources(sources.value.filter((s) => s.id !== id))
    settings.strategy.composites = settings.strategy.composites.filter((c) => c.sourceId !== id)
    delete settings.strategy.sourceAuto[id]
  }

  function moveSource(id: string, delta: -1 | 1) {
    const list = [...sources.value]
    const i = list.findIndex((s) => s.id === id)
    const j = i + delta
    if (i < 0 || j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    setSources(list)
  }

  async function save() {
    const data: StoredProject = { settings: plain(settings), sources: plain(sources.value), savedAt: new Date().toISOString() }
    try {
      await idbSet(STORAGE_KEY, data)
      savedSignature.value = signature.value
      savedAt.value = data.savedAt
      hasSavedProject.value = true
      notify(t('toast.saved'), 'success')
    } catch (err) {
      notify(t('toast.saveFailed', { detail: (err as Error).message }), 'error')
    }
  }

  async function restore() {
    try {
      const data = await idbGet<StoredProject>(STORAGE_KEY)
      if (data) {
        Object.assign(settings, normalizeSettings(data.settings))
        setSources(data.sources ?? [])
        savedAt.value = data.savedAt
        hasSavedProject.value = true
      }
    } catch {
      // IndexedDB can be unavailable (private mode); the app still works in memory.
    }
    savedSignature.value = signature.value
    ready.value = true
  }

  async function clearLocal() {
    await idbDelete(STORAGE_KEY).catch(() => undefined)
    Object.assign(settings, createDefaultSettings(locale.value))
    setSources([])
    hasSavedProject.value = false
    savedAt.value = null
    savedSignature.value = signature.value
    notify(t('toast.cleared'), 'success')
  }

  function exportProjectFile(includeNodes = false) {
    const file = exportProject(plain(settings), sources.value, includeNodes)
    downloadText(PROJECT_FILE_NAME, JSON.stringify(file, null, 2), 'application/json')
  }

  async function importProjectFile(file: File) {
    try {
      const { settings: next, sources: list } = importProject(await file.text())
      Object.assign(settings, next)
      setSources(list)
      const waiting = list.filter((s) => !s.nodes.length).length
      notify(waiting ? t('toast.projectWaiting', { n: waiting }) : t('toast.projectLoaded'), 'success')
    } catch (err) {
      notify(err instanceof ProjectFileError ? tDynamic(`projectError.${err.code}`, err.params) : (err as Error).message, 'error')
    }
  }

  function downloadConfig(): boolean {
    if (!build.value.ok) {
      notify(t('toast.hasErrors'), 'error')
      return false
    }
    downloadText('config.yaml', build.value.yaml, 'application/yaml;charset=utf-8')
    return true
  }

  // A brand-new project follows the interface language for its name and group names.
  watch(locale, (next) => {
    if (!ready.value || hasSavedProject.value || sources.value.length) return
    const fresh = createDefaultSettings(next)
    settings.name = fresh.name
    settings.outputLocale = next
    savedSignature.value = signature.value
  })

  return {
    settings,
    sources,
    pending,
    toasts,
    savedAt,
    ready,
    hasSavedProject,
    build,
    nodeCount,
    dirty,
    notify,
    importFiles,
    resolvePending,
    renameSourceById,
    removeSource,
    moveSource,
    save,
    restore,
    clearLocal,
    exportProjectFile,
    importProjectFile,
    downloadConfig,
  }
})
