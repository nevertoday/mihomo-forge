<script setup lang="ts">
import { computed } from 'vue'
import { regionName, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'

/** The region lines built from the files: same region, any provider, one line. */
const store = useProjectStore()
const regions = computed(() =>
  store.build.lines
    .filter((l) => l.kind === 'region')
    .map((l) => {
      const r = store.settings.regions.find((x) => x.id === l.regionId)
      return { id: l.ref, name: r ? regionName(r) : l.name, n: l.nodeCount, from: (l.sourceNames ?? []).join(t('common.listSep')) }
    }),
)
</script>

<template>
  <div v-if="regions.length" class="regions">
    <p class="title">{{ t('home.regionsTitle') }}</p>
    <ul>
      <li v-for="r in regions" :key="r.id">
        <span class="name">{{ r.name }}</span>
        <span class="n">{{ t('line.count', { n: r.n }) }}</span>
        <span class="from" dir="auto">{{ r.from }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.regions { display: grid; gap: var(--space-2); }
.title { margin: 0; color: var(--muted); font: var(--weight-medium) var(--text-xs) / var(--leading-xs) var(--font-body); }
ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-2) var(--space-4); margin: 0; padding: 0; list-style: none; }
li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--space-2); min-width: 0; }
.name { font: var(--weight-medium) var(--text-sm) / var(--leading-sm) var(--font-body); }
.n { color: var(--muted); font-size: var(--text-xs); font-variant-numeric: tabular-nums; }
.from { flex-basis: 100%; overflow: hidden; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-xs); text-overflow: ellipsis; white-space: nowrap; }
</style>
