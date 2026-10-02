<script setup lang="ts">
import { computed } from 'vue'
import { OTHER_REGION_ID } from '@/catalog/regions'
import { fill, NAMING, regionLabel } from '@/core/naming'
import { regionName, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { RegionDefinition } from '@/types'

/** `compact` is the wizard's Step 3: same settings, fewer knobs. */
defineProps<{ compact?: boolean }>()
const store = useProjectStore()
const s = computed(() => store.settings.strategy)
/** Group names exactly as they will appear in config.yaml. */
const naming = computed(() => NAMING[store.settings.outputLocale])
const outName = (tpl: string, r: RegionDefinition) => fill(tpl, { icon: r.icon, region: regionLabel(r, store.settings.outputLocale) })

const regionCounts = computed(() => {
  const m = new Map<string, number>()
  for (const n of store.build.nodes) m.set(n.regionId ?? OTHER_REGION_ID, (m.get(n.regionId ?? OTHER_REGION_ID) ?? 0) + 1)
  return m
})

/** Regions with nodes first, then the rest of the catalog. */
const regions = computed(() =>
  [...store.settings.regions].sort((a, b) => {
    if (a.id === OTHER_REGION_ID) return 1
    if (b.id === OTHER_REGION_ID) return -1
    return (regionCounts.value.get(b.id) ?? 0) - (regionCounts.value.get(a.id) ?? 0)
  }),
)

function modes(id: string) {
  return (s.value.regionModes[id] ??= { manual: true, auto: true })
}

const globals = computed(() => [
  { key: 'globalManual', label: naming.value.globalManual, hint: t('strategy.globalManualHint') },
  { key: 'globalAuto', label: naming.value.globalAuto, hint: t('strategy.globalAutoHint') },
  { key: 'globalFallback', label: naming.value.globalFallback, hint: t('strategy.globalFallbackHint') },
] as const)
</script>

<template>
  <div class="strategy-options">
    <section class="block">
      <header class="block-head">
        <h3 class="section-title">{{ t('strategy.globalTitle') }}</h3>
        <p class="section-note">{{ t('strategy.globalNote') }}</p>
      </header>
      <div class="grid opts">
        <label v-for="g in globals" :key="g.key" class="check card-check">
          <input v-model="s[g.key]" type="checkbox" />
          <span class="check-label"><strong>{{ g.label }}</strong><small>{{ g.hint }}</small></span>
        </label>
      </div>
    </section>

    <section class="block">
      <header class="block-head">
        <label class="check head-check">
          <input v-model="s.byRegion" type="checkbox" />
          <span class="check-label"><strong class="section-title">{{ t('strategy.regionTitle') }}</strong></span>
        </label>
        <p class="section-note">{{ t('strategy.regionNote') }}</p>
      </header>
      <div v-if="compact" class="row" :class="{ off: !s.byRegion }">
        <button
          v-for="r in regions"
          :key="r.id"
          type="button"
          class="chip chip-toggle"
          :aria-pressed="!!s.enabledRegions[r.id]"
          :disabled="!s.byRegion"
          @click="s.enabledRegions[r.id] = !s.enabledRegions[r.id]"
        >
          {{ r.icon }} {{ regionName(r) }} <span class="num">{{ regionCounts.get(r.id) ?? 0 }}</span>
        </button>
      </div>
      <div v-else class="table-wrap" :class="{ off: !s.byRegion }">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('strategy.colEnable') }}</th>
              <th>{{ t('strategy.colRegion') }}</th>
              <th>{{ t('strategy.colNodes') }}</th>
              <th>{{ t('strategy.colManual') }}</th>
              <th>{{ t('strategy.colAuto') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in regions" :key="r.id" :class="{ dim: !s.enabledRegions[r.id] }">
              <td><label class="check tight"><input v-model="s.enabledRegions[r.id]" type="checkbox" :disabled="!s.byRegion" :aria-label="regionName(r)" /></label></td>
              <td><strong>{{ r.icon }} {{ regionName(r) }}</strong></td>
              <td class="num">{{ regionCounts.get(r.id) ?? 0 }}</td>
              <td>
                <label class="check tight">
                  <input v-model="modes(r.id).manual" type="checkbox" :disabled="!s.byRegion || !s.enabledRegions[r.id]" />
                  <span class="muted">{{ outName(naming.regionManual, r) }}</span>
                </label>
              </td>
              <td>
                <label class="check tight">
                  <input v-model="modes(r.id).auto" type="checkbox" :disabled="!s.byRegion || !s.enabledRegions[r.id]" />
                  <span class="muted">{{ outName(naming.regionAuto, r) }}</span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="block">
      <header class="block-head">
        <label class="check head-check">
          <input v-model="s.bySource" type="checkbox" />
          <span class="check-label"><strong class="section-title">{{ t('strategy.sourceTitle') }}</strong></span>
        </label>
        <p class="section-note">{{ t('strategy.sourceNote') }}{{ compact ? '' : ' ' + t('strategy.sourceNoteMore') }}</p>
      </header>
      <div v-if="!compact" class="grid opts" :class="{ off: !s.bySource }">
        <div v-for="src in store.sources" :key="src.id" class="card card-quiet src-row">
          <strong dir="auto">{{ fill(naming.sourceManual, { source: src.name }) }}</strong>
          <label class="check tight">
            <input v-model="s.sourceAuto[src.id]" type="checkbox" :disabled="!s.bySource" />
            <span class="muted">{{ t('strategy.sourceAuto', { name: fill(naming.sourceAuto, { source: src.name }) }) }}</span>
          </label>
        </div>
        <p v-if="!store.sources.length" class="muted">{{ t('strategy.emptySources') }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.strategy-options { display: grid; gap: 32px; }
.block { display: grid; gap: 12px; }
.block-head { display: grid; gap: 2px; }
.head-check { padding: 0; min-height: 0; align-items: center; }
.head-check:hover { background: transparent; }
.head-check input { margin-top: 0; }
.opts { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; }
.card-check { border: 1px solid var(--line); background: var(--panel); padding: 12px; }
.card-check:has(input:checked) { border-color: var(--ink); }
.check.tight { padding: 2px 0; min-height: 0; align-items: center; }
.check.tight:hover { background: transparent; }
.check.tight input { margin-top: 0; }
.off { opacity: 0.45; pointer-events: none; }
tr.dim td { color: var(--muted); }
.src-row { display: grid; gap: 6px; padding: 12px; }
.chip-toggle .num { opacity: 0.7; }
</style>
