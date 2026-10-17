import { computed } from 'vue'
import { regionName, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { Line, LineRef } from '@/types'
import { plain } from '@/utils/plain'

export interface LineOptionGroup {
  label: string
  options: { ref: LineRef; label: string }[]
}

/** Names and choices for purpose lines, in the interface language (config names stay as built). */
export function useLines() {
  const store = useProjectStore()
  const byRef = computed(() => new Map<LineRef, Line>(store.build.lines.map((l) => [l.ref, l])))

  function label(ref: LineRef): string {
    if (ref === 'all') return t('line.all')
    if (ref === 'DIRECT') return t('line.direct')
    if (ref === 'REJECT') return t('line.reject')
    const i = ref.indexOf(':')
    const kind = ref.slice(0, i)
    const id = ref.slice(i + 1)
    if (kind === 'region') {
      const r = store.settings.regions.find((x) => x.id === id)
      return r ? regionName(r) : id
    }
    if (kind === 'source') return store.sources.find((s) => s.id === id)?.name ?? t('line.goneSource')
    if (kind === 'node') {
      const built = byRef.value.get(ref)
      if (built) return built.name
      const node = store.sources.flatMap((s) => s.nodes).find((n) => n.fingerprint === id)
      return node ? `[${node.sourceName}] ${node.originalName}` : t('line.goneNode')
    }
    return plain(byRef.value.get(ref)?.name) || t('line.goneGroup')
  }

  /** One line of explanation: what the line contains and how it picks. */
  function detail(ref: LineRef): string {
    const line = byRef.value.get(ref)
    if (!line) return t('line.missing')
    if (line.kind === 'builtin') return ref === 'DIRECT' ? t('line.directDesc') : t('line.rejectDesc')
    if (line.kind === 'node') return t('line.nodeDesc')
    const from = line.sourceNames?.length ? ` · ${line.sourceNames.join(t('common.listSep'))}` : ''
    return `${t('line.fastest', { n: line.nodeCount })}${from}`
  }

  const exists = (ref: LineRef) => byRef.value.has(ref)

  /** What the “add a line” menu offers, most useful first. */
  const groups = computed<LineOptionGroup[]>(() => {
    const lines = store.build.lines
    const pick = (kind: Line['kind'] | Line['kind'][]) =>
      lines.filter((l) => ([] as string[]).concat(kind).includes(l.kind)).map((l) => ({ ref: l.ref, label: optionLabel(l) }))
    return [
      { label: t('line.groupRegions'), options: pick('region') },
      { label: t('line.groupGeneral'), options: [...pick('all'), ...pick('builtin')] },
      { label: t('line.groupSources'), options: pick('source') },
      { label: t('line.groupAdvanced'), options: pick(['filter', 'composite']) },
      { label: t('line.groupNodes'), options: pick('node') },
    ].filter((g) => g.options.length)
  })

  function optionLabel(l: Line): string {
    if (l.kind === 'region' || l.kind === 'all' || l.kind === 'source') return `${label(l.ref)} · ${t('line.count', { n: l.nodeCount })}`
    return label(l.ref)
  }

  return { label, detail, exists, groups, byRef }
}
