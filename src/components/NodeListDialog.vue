<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { computed, ref } from 'vue'
import { OTHER_REGION_ID } from '@/catalog/regions'
import { regionName, t, tDynamic } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { NodeWarning, RejectedNode, Source } from '@/types'
import KitDialog from './KitDialog.vue'

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

</script>

<template>
  <KitDialog size="xl" light-dismiss labelledby="node-list-title" @close="emit('close')">
    <div class="xxd-dialog__head">
      <h2 id="node-list-title" class="xxd-dialog__title">{{ t('nodeList.title', { name: source.name }) }} <span class="count">· {{ t('count.nodes', { n: source.nodes.length }) }}</span></h2>
      <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only :aria-label="t('common.close')" @click="emit('close')"><Icon name="X" :size="16" /></button>
    </div>
    <div class="xxd-dialog__body body">
      <div class="xxd-cluster">
        <div class="xxd-input-wrap search">
          <Icon name="Search" :size="16" />
          <input v-model="query" class="xxd-input" type="search" :placeholder="t('nodeList.search')" :aria-label="t('nodeList.search')" />
        </div>
        <label class="xxd-choice"><input v-model="onlyIssues" type="checkbox" class="xxd-check" />{{ t('nodeList.onlyIssues') }}</label>
      </div>
      <div class="xxd-table-wrap list">
        <table class="xxd-table" data-density="compact" data-sticky-head>
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
              <td><span class="xxd-badge mono">{{ node.raw.type }}</span></td>
              <td class="server" dir="ltr">{{ node.raw.server }}:{{ node.raw.port }}</td>
              <td>
                <label class="xxd-select" data-size="sm">
                  <select
                    :value="store.settings.regionOverrides[node.fingerprint] ?? '__auto'"
                    :disabled="!out"
                    :aria-label="t('nodeList.regionLabel')"
                    @change="setRegion(node.fingerprint, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="__auto">{{ t('nodeList.regionAuto', { region: labelOf(out?.regionId ?? OTHER_REGION_ID) }) }}</option>
                    <option v-for="r in store.settings.regions" :key="r.id" :value="r.id">{{ r.icon }} {{ regionName(r) }}</option>
                  </select>
                </label>
              </td>
              <td class="warn" data-wrap>
                <template v-if="!out">{{ t('nodeList.duplicate') }}</template>
                <template v-else>{{ out.warnings.map(warningText).join('; ') }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <details v-if="source.rejected.length" class="xxd-collapse">
        <summary>{{ t('nodeList.rejectedSummary', { n: source.rejected.length }) }}</summary>
        <ul class="rejected">
          <li v-for="(r, i) in source.rejected" :key="i"><span class="rejected-name" dir="auto">{{ r.name }}</span> — {{ rejectText(r) }}</li>
        </ul>
      </details>
    </div>
  </KitDialog>
</template>

<style scoped>
.count { color: var(--muted); font-weight: var(--weight-regular); }
.body { padding-bottom: var(--space-5); color: var(--ink); }
.search { flex: 1; min-width: 220px; }
.list { max-height: 56dvh; overflow: auto; }
.name { min-width: 200px; font-weight: var(--weight-medium); }
.mono { font-family: var(--font-mono); }
.server { max-width: 220px; overflow: hidden; color: var(--muted); font-family: var(--font-mono); font-size: var(--text-xs); text-overflow: ellipsis; }
.xxd-select { min-width: 140px; }
.warn { min-width: 160px; color: var(--warning); font-size: var(--text-xs); }
tr.dup td { color: var(--disabled-ink); }
.rejected { margin: var(--space-2) 0 0; padding-inline-start: var(--space-5); color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }
.rejected-name { color: var(--ink); font-weight: var(--weight-medium); }
</style>
