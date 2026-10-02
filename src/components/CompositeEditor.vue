<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { OTHER_REGION_ID } from '@/catalog/regions'
import { fill, NAMING, regionLabel } from '@/core/naming'
import { regionName, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { GroupMode } from '@/types'
import { uid } from '@/utils/hash'

const store = useProjectStore()
const list = computed(() => store.settings.strategy.composites)
const open = ref(false)
const sourceId = ref('')
const regionId = ref('')
const mode = ref<GroupMode>('url-test')
const displayName = ref('')

const MODES = computed(
  () =>
    [
      { id: 'select', label: t('composite.modeSelect') },
      { id: 'url-test', label: t('composite.modeUrlTest') },
      { id: 'fallback', label: t('composite.modeFallback') },
    ] as { id: GroupMode; label: string }[],
)
const modeLabel = (m: GroupMode) => MODES.value.find((x) => x.id === m)?.label ?? m

/** Example in the output language, e.g. `🇺🇸 奶昔 / 美国`. */
const example = computed(() => {
  const out = store.settings.outputLocale
  const src = store.sources.find((s) => s.id === sourceId.value)?.name ?? store.sources[0]?.name ?? 'Provider'
  const region = store.settings.regions.find((r) => r.id === (regionId.value || 'us'))!
  return fill(NAMING[out].composite, { icon: region.icon, source: src, region: regionLabel(region, out) })
})

/** Only offer combinations that actually contain nodes. */
const counts = computed(() => {
  const m = new Map<string, number>()
  for (const n of store.build.nodes) {
    const k = `${n.sourceId}|${n.regionId ?? OTHER_REGION_ID}`
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
})
const regionsForSource = computed(() =>
  store.settings.regions.filter((r) => counts.value.has(`${sourceId.value}|${r.id}`)),
)
const builtByRef = computed(() => new Map(store.build.strategies.map((s) => [s.ref, s])))

function add() {
  if (!sourceId.value || !regionId.value) return
  store.settings.strategy.composites.push({
    id: uid(),
    sourceId: sourceId.value,
    regionId: regionId.value,
    mode: mode.value,
    ...(displayName.value.trim() ? { displayName: displayName.value.trim() } : {}),
  })
  displayName.value = ''
  regionId.value = ''
  open.value = false
}

function remove(id: string) {
  store.settings.strategy.composites = list.value.filter((c) => c.id !== id)
  for (const b of Object.values(store.settings.business)) {
    b.candidates = b.candidates.filter((r) => r !== `composite:${id}`)
  }
}

const sourceName = (id: string) => store.sources.find((s) => s.id === id)?.name ?? t('common.deleted')
const regionOf = (id: string) => store.settings.regions.find((r) => r.id === id)
</script>

<template>
  <section class="composites">
    <header class="block-head">
      <h3 class="section-title">{{ t('composite.title') }}</h3>
      <p class="section-note">{{ t('composite.note', { example }) }}</p>
    </header>

    <div v-if="list.length" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>{{ t('composite.colGroup') }}</th>
            <th>{{ t('composite.colSource') }}</th>
            <th>{{ t('composite.colRegion') }}</th>
            <th>{{ t('composite.colMode') }}</th>
            <th>{{ t('composite.colNodes') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in list" :key="c.id">
            <td dir="auto"><strong>{{ builtByRef.get(`composite:${c.id}`)?.group.name ?? c.displayName ?? '—' }}</strong></td>
            <td dir="auto">{{ sourceName(c.sourceId) }}</td>
            <td>{{ regionOf(c.regionId)?.icon }} {{ regionOf(c.regionId) ? regionName(regionOf(c.regionId)!) : '' }}</td>
            <td><span class="chip">{{ modeLabel(c.mode) }}</span></td>
            <td class="num">{{ builtByRef.get(`composite:${c.id}`)?.nodeCount ?? 0 }}</td>
            <td class="end"><button type="button" class="icon-btn" :aria-label="t('composite.remove')" @click="remove(c.id)"><Trash2 /></button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <form v-if="open" class="card creator" @submit.prevent="add">
      <label class="field">
        <span>{{ t('composite.colSource') }}</span>
        <select v-model="sourceId" class="select" required @change="regionId = ''">
          <option value="" disabled>{{ t('composite.pickSource') }}</option>
          <option v-for="s in store.sources" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </label>
      <label class="field">
        <span>{{ t('composite.colRegion') }}</span>
        <select v-model="regionId" class="select" required :disabled="!sourceId">
          <option value="" disabled>{{ t('composite.pickRegion') }}</option>
          <option v-for="r in regionsForSource" :key="r.id" :value="r.id">{{ r.icon }} {{ regionName(r) }} ({{ counts.get(`${sourceId}|${r.id}`) }})</option>
        </select>
      </label>
      <label class="field">
        <span>{{ t('composite.colMode') }}</span>
        <select v-model="mode" class="select">
          <option v-for="m in MODES" :key="m.id" :value="m.id">{{ m.label }}</option>
        </select>
      </label>
      <label class="field">
        <span>{{ t('composite.nameOptional') }}</span>
        <input v-model="displayName" class="input" dir="auto" maxlength="40" :placeholder="t('composite.namePlaceholder', { example })" />
      </label>
      <div class="row creator-actions">
        <button type="button" class="btn" @click="open = false">{{ t('common.cancel') }}</button>
        <button type="submit" class="btn btn-primary" :disabled="!sourceId || !regionId">{{ t('composite.create') }}</button>
      </div>
    </form>
    <button v-else type="button" class="btn add" :disabled="!store.sources.length" @click="open = true"><Plus />{{ t('composite.add') }}</button>
  </section>
</template>

<style scoped>
.composites { display: grid; gap: 12px; }
.block-head { display: grid; gap: 2px; }
.creator { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; align-items: end; }
.creator-actions { grid-column: 1 / -1; justify-content: flex-end; }
.add { justify-self: start; border-style: dashed; }
.end { text-align: end; }
</style>
