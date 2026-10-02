<script setup lang="ts">
import { computed, ref } from 'vue'
import DropZone from '@/components/DropZone.vue'
import NodeListDialog from '@/components/NodeListDialog.vue'
import PrivacyNote from '@/components/PrivacyNote.vue'
import SourceCard from '@/components/SourceCard.vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { DedupeMode, Source } from '@/types'

const store = useProjectStore()
const viewing = ref<Source | null>(null)

const DEDUPE = computed<{ id: DedupeMode; label: string; hint: string }[]>(() => [
  { id: 'global', label: t('sourcesPage.dedupeGlobal'), hint: t('sourcesPage.dedupeGlobalHint') },
  { id: 'source', label: t('sourcesPage.dedupeSource'), hint: t('sourcesPage.dedupeSourceHint') },
  { id: 'none', label: t('sourcesPage.dedupeNone'), hint: t('sourcesPage.dedupeNoneHint') },
])
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <p class="eyebrow">{{ t('sourcesPage.eyebrow') }}</p>
        <h1 class="page-title">{{ t('nav.sources') }}</h1>
        <p class="page-lede">{{ t('sourcesPage.lede') }}</p>
      </div>
      <p class="chip chip-dark">{{ t('count.sources', { n: store.sources.length }) }} · {{ t('count.nodes', { n: store.nodeCount }) }}</p>
    </header>

    <div class="stack">
      <PrivacyNote />
      <DropZone :compact="store.sources.length > 0" />
    </div>

    <section v-if="store.sources.length" class="section">
      <div class="grid grid-cards">
        <SourceCard v-for="(s, i) in store.sources" :key="s.id" :source="s" :index="i" :total="store.sources.length" @view="viewing = $event" />
      </div>
      <p class="section-note order-note">{{ t('sourcesPage.orderNote') }}</p>
    </section>

    <details class="section advanced">
      <summary>{{ t('sourcesPage.advanced') }}</summary>
      <div class="section-head">
        <h2 class="section-title">{{ t('sourcesPage.dedupeTitle') }}</h2>
      </div>
      <div class="grid dedupe">
        <label v-for="d in DEDUPE" :key="d.id" class="check card-check">
          <input v-model="store.settings.dedupeMode" type="radio" name="dedupe" :value="d.id" />
          <span class="check-label"><strong>{{ d.label }}</strong><small>{{ d.hint }}</small></span>
        </label>
      </div>
      <label class="check info-check">
        <input v-model="store.settings.excludeInfoNodes" type="checkbox" />
        <span class="check-label"><strong>{{ t('sourcesPage.excludeInfo') }}</strong><small>{{ t('sourcesPage.excludeInfoHint') }}</small></span>
      </label>
    </details>

    <NodeListDialog v-if="viewing" :source="viewing" @close="viewing = null" />
  </div>
</template>

<style scoped>
.order-note { margin-top: 10px; }
.dedupe { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 8px; }
.card-check { border: 1px solid var(--line); background: var(--panel); padding: 12px; }
.card-check:has(input:checked) { border-color: var(--ink); }
.info-check { margin-top: 10px; }
.advanced > summary { cursor: pointer; font-weight: 700; color: var(--muted); margin-bottom: 14px; }
.advanced[open] > summary { color: var(--ink); }
</style>
