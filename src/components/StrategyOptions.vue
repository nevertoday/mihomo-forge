<script setup lang="ts">
import { plain } from '@/utils/plain'
import { computed, ref } from 'vue'
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
const allRegions = computed(() =>
  [...store.settings.regions].sort((a, b) => {
    if (a.id === OTHER_REGION_ID) return 1
    if (b.id === OTHER_REGION_ID) return -1
    return (regionCounts.value.get(b.id) ?? 0) - (regionCounts.value.get(a.id) ?? 0)
  }),
)

/** Empty regions are noise for most people: hidden until asked for. */
const showEmpty = ref(false)
const emptyCount = computed(() => allRegions.value.filter((r) => !regionCounts.value.get(r.id)).length)
const regions = computed(() =>
  showEmpty.value || !store.build.nodes.length ? allRegions.value : allRegions.value.filter((r) => regionCounts.value.get(r.id)),
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
        <label v-for="g in globals" :key="g.key" class="xxd-choice card-check">
          <input class="xxd-check" v-model="s[g.key]" type="checkbox" />
          <span class="check-label"><strong>{{ plain(g.label) }}</strong><small>{{ g.hint }}</small></span>
        </label>
      </div>
    </section>

    <section class="block">
      <header class="block-head">
        <label class="xxd-choice head-check">
          <input class="xxd-check" v-model="s.byRegion" type="checkbox" />
          <span class="check-label"><strong class="section-title">{{ t('strategy.regionTitle') }}</strong></span>
        </label>
        <p class="section-note">{{ t('strategy.regionNote') }}</p>
      </header>
      <div v-if="compact" class="row" :class="{ off: !s.byRegion }">
        <button
          v-for="r in regions"
          :key="r.id"
          type="button"
          class="xxd-chip"
          :aria-pressed="!!s.enabledRegions[r.id]"
          :disabled="!s.byRegion"
          @click="s.enabledRegions[r.id] = !s.enabledRegions[r.id]"
        >
          {{ regionName(r) }} <span class="num">{{ regionCounts.get(r.id) ?? 0 }}</span>
        </button>
      </div>
      <div v-else class="xxd-table-wrap" :class="{ off: !s.byRegion }">
        <table class="xxd-table">
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
              <td><label class="xxd-choice tight"><input class="xxd-check" v-model="s.enabledRegions[r.id]" type="checkbox" :disabled="!s.byRegion" :aria-label="regionName(r)" /></label></td>
              <td><strong>{{ regionName(r) }}</strong></td>
              <td class="num">{{ regionCounts.get(r.id) ?? 0 }}</td>
              <td>
                <label class="xxd-choice tight">
                  <input class="xxd-check" v-model="modes(r.id).manual" type="checkbox" :disabled="!s.byRegion || !s.enabledRegions[r.id]" />
                  <span class="muted">{{ plain(outName(naming.regionManual, r)) }}</span>
                </label>
              </td>
              <td>
                <label class="xxd-choice tight">
                  <input class="xxd-check" v-model="modes(r.id).auto" type="checkbox" :disabled="!s.byRegion || !s.enabledRegions[r.id]" />
                  <span class="muted">{{ plain(outName(naming.regionAuto, r)) }}</span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button v-if="emptyCount && store.build.nodes.length" type="button" class="xxd-btn toggle-empty" data-size="sm" data-variant="ghost" @click="showEmpty = !showEmpty">
        {{ showEmpty ? t('strategy.hideEmpty') : t('strategy.showEmpty', { n: emptyCount }) }}
      </button>
    </section>

    <section class="block">
      <header class="block-head">
        <label class="xxd-choice head-check">
          <input class="xxd-check" v-model="s.bySource" type="checkbox" />
          <span class="check-label"><strong class="section-title">{{ t('strategy.sourceTitle') }}</strong></span>
        </label>
        <p class="section-note">{{ t('strategy.sourceNote') }}{{ compact ? '' : ' ' + t('strategy.sourceNoteMore') }}</p>
      </header>
      <div v-if="!compact" class="grid opts" :class="{ off: !s.bySource }">
        <div v-for="src in store.sources" :key="src.id" class="card card-quiet src-row">
          <strong dir="auto">{{ plain(fill(naming.sourceManual, { source: src.name })) }}</strong>
          <label class="xxd-choice tight">
            <input class="xxd-check" v-model="s.sourceAuto[src.id]" type="checkbox" :disabled="!s.bySource" />
            <span class="muted">{{ t('strategy.sourceAuto', { name: plain(fill(naming.sourceAuto, { source: src.name })) }) }}</span>
          </label>
        </div>
        <p v-if="!store.sources.length" class="muted">{{ t('strategy.emptySources') }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.strategy-options { display: grid; gap: var(--space-8); }
.block { display: grid; gap: var(--space-3); }
.block-head { display: grid; gap: var(--space-0-5); }
.head-check { align-items: center; }
.opts { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-2); }
.tight { align-items: center; }
.off { opacity: 0.45; pointer-events: none; }
tr.dim td { color: var(--muted); }
.src-row { display: grid; gap: var(--space-1-5); padding: var(--space-3); }
.xxd-chip .num { color: var(--muted); }
.toggle-empty { justify-self: start; }
</style>
