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
        <h1 class="page-title">{{ t('nav.sources') }}</h1>
        <p class="page-lede">{{ t('sourcesPage.lede') }}</p>
      </div>
      <p class="xxd-badge">{{ t('count.sources', { n: store.sources.length }) }} · {{ t('count.nodes', { n: store.nodeCount }) }}</p>
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

    <details class="xxd-collapse section advanced">
      <summary>{{ t('sourcesPage.advanced') }}</summary>
      <div class="section-head">
        <h2 class="section-title">{{ t('sourcesPage.dedupeTitle') }}</h2>
      </div>
      <div class="grid dedupe">
        <label v-for="d in DEDUPE" :key="d.id" class="xxd-choice card-check">
          <input class="xxd-radio" v-model="store.settings.dedupeMode" type="radio" name="dedupe" :value="d.id" />
          <span class="check-label"><strong>{{ d.label }}</strong><small>{{ d.hint }}</small></span>
        </label>
      </div>
      <label class="xxd-choice info-check">
        <input class="xxd-check" v-model="store.settings.excludeInfoNodes" type="checkbox" />
        <span class="check-label"><strong>{{ t('sourcesPage.excludeInfo') }}</strong><small>{{ t('sourcesPage.excludeInfoHint') }}</small></span>
      </label>
    </details>

    <NodeListDialog v-if="viewing" :source="viewing" @close="viewing = null" />
  </div>
</template>

<style scoped>
.order-note { margin-top: var(--space-2); }
.dedupe { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-2); }
.info-check { margin-top: var(--space-3); }
.advanced > summary { margin-bottom: var(--space-3); }
</style>
