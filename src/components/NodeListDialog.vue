<script setup lang="ts">
import { Search, X } from 'lucide-vue-next'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { OTHER_REGION_ID } from '@/catalog/regions'
import { regionName, t, tDynamic } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { NodeWarning, RejectedNode, Source } from '@/types'

const props = defineProps<{ source: Source }>()
const emit = defineEmits<{ close: [] }>()
const store = useProjectStore()
const query = ref('')
const onlyIssues = ref(false)

const built = computed(() => new Map(store.build.nodes.filter((n) => n.sourceId === props.source.id).map((n) => [n.fingerprint, n])))

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.source.nodes
    .map((n) => ({ node: n, out: built.value.get(n.fingerprint) }))
    .filter(({ node, out }) => {
      if (onlyIssues.value && !(out?.warnings.length || !out)) return false
      return !q || node.originalName.toLowerCase().includes(q) || String(node.raw.type).includes(q)
    })
})

const labelOf = (id: string) => {
  const r = store.settings.regions.find((x) => x.id === id)
  return r ? regionName(r) : id
}

function warningText(w: NodeWarning): string {
  const p = { ...w.params }
  if (typeof p.matches === 'string') p.matches = p.matches.split(',').map(labelOf).join(t('common.listSep'))
  if (typeof p.chosen === 'string') p.chosen = labelOf(p.chosen)
  return tDynamic(`nodeWarning.${w.code}`, p)
}

const rejectText = (r: RejectedNode) => tDynamic(`rejectReason.${r.code}`, r.params)

function setRegion(fingerprint: string, regionId: string) {
  if (regionId === '__auto') delete store.settings.regionOverrides[fingerprint]
  else store.settings.regionOverrides[fingerprint] = regionId
}

const onKey = (e: KeyboardEvent) => e.key === 'Escape' && emit('close')
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <section class="dialog dialog-wide" role="dialog" aria-modal="true" :aria-label="t('nodeList.title', { name: source.name })">
      <header class="dialog-head">
        <h2>{{ t('nodeList.title', { name: source.name }) }} <span class="muted">· {{ t('count.nodes', { n: source.nodes.length }) }}</span></h2>
        <button type="button" class="icon-btn" :aria-label="t('common.close')" @click="emit('close')"><X /></button>
      </header>
      <div class="dialog-body stack">
        <div class="row">
          <label class="search">
            <Search aria-hidden="true" />
            <input v-model="query" class="input" type="search" :placeholder="t('nodeList.search')" />
          </label>
          <label class="check"><input v-model="onlyIssues" type="checkbox" /><span>{{ t('nodeList.onlyIssues') }}</span></label>
        </div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('nodeList.colName') }}</th>
                <th>{{ t('nodeList.colType') }}</th>
                <th>{{ t('nodeList.colServer') }}</th>
                <th>{{ t('nodeList.colRegion') }}</th>
                <th>{{ t('nodeList.colNotes') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="{ node, out } in rows" :key="node.fingerprint + node.originalName" :class="{ dup: !out }">
                <td class="name" dir="auto">{{ out?.displayName ?? `[${source.name}] ${node.originalName}` }}</td>
                <td><span class="chip mono">{{ node.raw.type }}</span></td>
                <td class="mono server" dir="ltr">{{ node.raw.server }}:{{ node.raw.port }}</td>
                <td>
                  <select
                    class="select region"
                    :value="store.settings.regionOverrides[node.fingerprint] ?? '__auto'"
                    :disabled="!out"
                    :aria-label="t('nodeList.regionLabel')"
                    @change="setRegion(node.fingerprint, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="__auto">{{ t('nodeList.regionAuto', { region: labelOf(out?.regionId ?? OTHER_REGION_ID) }) }}</option>
                    <option v-for="r in store.settings.regions" :key="r.id" :value="r.id">{{ r.icon }} {{ regionName(r) }}</option>
                  </select>
                </td>
                <td class="warn">
                  <template v-if="!out">{{ t('nodeList.duplicate') }}</template>
                  <template v-else>{{ out.warnings.map(warningText).join('; ') }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <details v-if="source.rejected.length" class="rejected">
          <summary>{{ t('nodeList.rejectedSummary', { n: source.rejected.length }) }}</summary>
          <ul>
            <li v-for="(r, i) in source.rejected" :key="i"><b dir="auto">{{ r.name }}</b> — {{ rejectText(r) }}</li>
          </ul>
        </details>
      </div>
    </section>
  </div>
</template>

<style scoped>
.search { position: relative; flex: 1; min-width: 220px; }
.search svg { position: absolute; inset-inline-start: 12px; top: 50%; width: 16px; height: 16px; transform: translateY(-50%); color: var(--muted); }
.search .input { padding-inline-start: 36px; }
.table-wrap { max-height: 56dvh; }
.name { font-weight: 600; min-width: 200px; }
.server { color: var(--muted); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.region { min-height: 32px; padding-top: 4px; padding-bottom: 4px; min-width: 140px; }
.warn { color: var(--notice-warning-ink); font-size: 12px; min-width: 160px; }
tr.dup td { opacity: 0.5; }
.rejected summary { cursor: pointer; font-weight: 700; }
.rejected ul { margin: 8px 0 0; padding-inline-start: 18px; color: var(--muted); font-size: 13px; }
</style>
