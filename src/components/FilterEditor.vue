<script setup lang="ts">
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { computed, reactive, ref } from 'vue'
import { compileFilter, matchesFilter, parseTerms } from '@/core/strategies'
import { regionName, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { FilterStrategy, GroupMode, ProxyGroup } from '@/types'
import { uid } from '@/utils/hash'

const store = useProjectStore()
const list = computed(() => store.settings.strategy.filters)
const builtByRef = computed(() => new Map(store.build.strategies.map((s) => [s.ref, s])))

/** `null` = form closed, '' = creating, otherwise the id being edited. */
const editing = ref<string | null>(null)
const error = ref('')
const draft = reactive({
  name: '',
  includeText: '',
  excludeText: '',
  regex: false,
  sourceIds: [] as string[],
  regionId: '' as string,
  mode: 'url-test' as GroupMode,
})

const MODES = computed(
  () =>
    [
      { id: 'url-test', label: t('composite.modeUrlTest') },
      { id: 'select', label: t('composite.modeSelect') },
      { id: 'fallback', label: t('composite.modeFallback') },
    ] as { id: GroupMode; label: string }[],
)
const modeLabel = (m: GroupMode) => MODES.value.find((x) => x.id === m)?.label ?? m

const draftFilter = computed(() => ({
  include: parseTerms(draft.includeText),
  exclude: parseTerms(draft.excludeText),
  regex: draft.regex,
  sourceIds: draft.sourceIds,
  regionId: draft.regionId || null,
}))
const compiled = computed(() => compileFilter(draftFilter.value))
/** Live preview against the deduplicated, classified nodes of the current build. */
const matches = computed(() => store.build.nodes.filter((n) => matchesFilter(n, draftFilter.value, compiled.value)))
const PREVIEW = 12
const suggestedName = computed(() => {
  const terms = draftFilter.value.include
  return terms.length ? `🔎 ${terms.join(' ')}` : ''
})

function open(f?: FilterStrategy) {
  error.value = ''
  editing.value = f?.id ?? ''
  draft.name = f?.name ?? ''
  draft.includeText = f?.include.join(' ') ?? ''
  draft.excludeText = f?.exclude.join(' ') ?? ''
  draft.regex = f?.regex ?? false
  draft.sourceIds = [...(f?.sourceIds ?? [])]
  draft.regionId = f?.regionId ?? ''
  draft.mode = f?.mode ?? 'url-test'
}

function toggleSource(id: string) {
  draft.sourceIds = draft.sourceIds.includes(id) ? draft.sourceIds.filter((s) => s !== id) : [...draft.sourceIds, id]
}

function submit() {
  const name = draft.name.trim() || suggestedName.value
  if (!name) return (error.value = t('filter.errName'))
  const current = editing.value ? builtByRef.value.get(`filter:${editing.value}`)?.group.name : undefined
  const taken = new Set([
    ...(store.build.config['proxy-groups'] as ProxyGroup[]).map((g) => g.name).filter((n) => n !== current),
    ...store.build.nodes.map((n) => n.displayName),
    ...list.value.filter((f) => f.id !== editing.value).map((f) => f.name),
  ])
  if (taken.has(name)) return (error.value = t('filter.errTaken'))

  const value: FilterStrategy = {
    id: editing.value || uid(),
    name,
    ...draftFilter.value,
    mode: draft.mode,
  }
  const filters = store.settings.strategy.filters
  const i = filters.findIndex((f) => f.id === value.id)
  if (i >= 0) filters[i] = value
  else filters.push(value)
  editing.value = null
}

function remove(id: string) {
  store.settings.strategy.filters = list.value.filter((f) => f.id !== id)
  for (const b of Object.values(store.settings.business)) b.candidates = b.candidates.filter((r) => r !== `filter:${id}`)
  if (editing.value === id) editing.value = null
}

function summary(f: FilterStrategy): string {
  const parts: string[] = []
  if (f.include.length) parts.push(t('filter.sumInclude', { terms: f.include.join(' / ') }))
  if (f.exclude.length) parts.push(t('filter.sumExclude', { terms: f.exclude.join(' / ') }))
  if (f.sourceIds.length)
    parts.push(f.sourceIds.map((id) => store.sources.find((s) => s.id === id)?.name ?? t('common.deleted')).join(' / '))
  if (f.regionId) {
    const r = store.settings.regions.find((x) => x.id === f.regionId)
    if (r) parts.push(`${r.icon} ${regionName(r)}`)
  }
  return parts.join(t('filter.sumSep')) || t('filter.sumAll')
}
</script>

<template>
  <section class="filters">
    <header class="block-head">
      <h3 class="section-title">{{ t('filter.title') }}</h3>
      <p class="section-note">{{ t('filter.note') }}</p>
    </header>

    <div v-if="list.length" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>{{ t('filter.colGroup') }}</th>
            <th>{{ t('filter.colRule') }}</th>
            <th>{{ t('filter.colMode') }}</th>
            <th>{{ t('filter.colNodes') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in list" :key="f.id" :class="{ empty: !builtByRef.get(`filter:${f.id}`) }">
            <td dir="auto"><strong>{{ f.name }}</strong></td>
            <td class="muted" dir="auto">{{ summary(f) }}</td>
            <td><span class="chip">{{ modeLabel(f.mode) }}</span></td>
            <td class="num">{{ builtByRef.get(`filter:${f.id}`)?.nodeCount ?? 0 }}</td>
            <td class="end">
              <button type="button" class="icon-btn" :aria-label="t('filter.edit')" @click="open(f)"><Pencil /></button>
              <button type="button" class="icon-btn" :aria-label="t('filter.remove')" @click="remove(f.id)"><Trash2 /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <form v-if="editing !== null" class="card editor" @submit.prevent="submit">
      <div class="fields">
        <label class="field">
          <span>{{ t('filter.include') }}</span>
          <input v-model="draft.includeText" class="input" dir="auto" placeholder="IEPL 专线" autofocus />
          <small>{{ t('filter.includeHint') }}</small>
        </label>
        <label class="field">
          <span>{{ t('filter.exclude') }}</span>
          <input v-model="draft.excludeText" class="input" dir="auto" />
          <small>{{ t('filter.excludeHint') }}</small>
        </label>
        <label class="field">
          <span>{{ t('filter.name') }}</span>
          <input
            v-model="draft.name"
            class="input"
            dir="auto"
            maxlength="40"
            :placeholder="suggestedName || t('filter.namePlaceholder', { example: '🚀 IEPL' })"
          />
        </label>
        <label class="field">
          <span>{{ t('filter.region') }}</span>
          <select v-model="draft.regionId" class="select">
            <option value="">{{ t('filter.anyRegion') }}</option>
            <option v-for="r in store.settings.regions" :key="r.id" :value="r.id">{{ r.icon }} {{ regionName(r) }}</option>
          </select>
        </label>
        <label class="field">
          <span>{{ t('filter.mode') }}</span>
          <select v-model="draft.mode" class="select">
            <option v-for="m in MODES" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
        </label>
      </div>

      <div class="field">
        <span>{{ t('filter.sources') }}</span>
        <div class="row">
          <button type="button" class="chip chip-toggle" :aria-pressed="!draft.sourceIds.length" @click="draft.sourceIds = []">
            {{ t('filter.allSources') }}
          </button>
          <button
            v-for="s in store.sources"
            :key="s.id"
            type="button"
            class="chip chip-toggle"
            :aria-pressed="draft.sourceIds.includes(s.id)"
            @click="toggleSource(s.id)"
          >
            <bdi>{{ s.name }}</bdi>
          </button>
        </div>
      </div>

      <label class="check regex">
        <input v-model="draft.regex" type="checkbox" />
        <span class="check-label"><strong>{{ t('filter.regex') }}</strong><small>{{ t('filter.regexHint') }}</small></span>
      </label>

      <div class="preview" :class="{ none: !matches.length }" role="status">
        <strong>{{ matches.length ? t('filter.preview', { n: matches.length }) : t('filter.previewNone') }}</strong>
        <p v-if="compiled.invalid.length" class="bad">{{ t('basePage.invalidPattern', { pattern: compiled.invalid.join(', ') }) }}</p>
        <ul v-if="matches.length">
          <li v-for="n in matches.slice(0, PREVIEW)" :key="n.displayName" dir="auto">{{ n.displayName }}</li>
          <li v-if="matches.length > PREVIEW" class="muted">{{ t('filter.previewMore', { n: matches.length - PREVIEW }) }}</li>
        </ul>
      </div>

      <p v-if="error" class="bad">{{ error }}</p>
      <div class="row actions">
        <button type="button" class="btn" @click="editing = null">{{ t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary" :disabled="!matches.length">{{ editing ? t('filter.save') : t('filter.create') }}</button>
      </div>
    </form>
    <button v-else type="button" class="btn add" :disabled="!store.sources.length" @click="open()"><Plus />{{ t('filter.add') }}</button>
  </section>
</template>

<style scoped>
.filters { display: grid; gap: 12px; }
.block-head { display: grid; gap: 2px; }
.editor { display: grid; gap: 14px; }
.fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; align-items: start; }
.regex { padding-inline-start: 0; }
.preview { padding: 12px 14px; border: 1px solid var(--notice-success-border); background: var(--notice-success-bg); }
.preview strong { color: var(--notice-success-ink); }
.preview.none { border-color: var(--notice-warning-border); background: var(--notice-warning-bg); }
.preview.none strong { color: var(--notice-warning-ink); }
.preview ul { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 8px 0 0; padding: 0; list-style: none; font-size: 12.5px; }
.bad { margin: 0; color: var(--notice-error-ink); font-size: 13px; }
.actions { justify-content: flex-end; }
.add { justify-self: start; border-style: dashed; }
.end { text-align: end; white-space: nowrap; }
tr.empty td { opacity: 0.55; }
</style>
