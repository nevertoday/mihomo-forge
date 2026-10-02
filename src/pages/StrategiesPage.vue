<script setup lang="ts">
import CompositeEditor from '@/components/CompositeEditor.vue'
import StrategyOptions from '@/components/StrategyOptions.vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <p class="eyebrow">{{ t('strategiesPage.eyebrow') }}</p>
        <h1 class="page-title">{{ t('nav.strategies') }}</h1>
        <p class="page-lede">{{ t('strategiesPage.lede') }}</p>
      </div>
      <p class="chip chip-dark">{{ t('count.strategyGroups', { n: store.build.strategies.length }) }}</p>
    </header>
    <StrategyOptions />
    <div class="composite-wrap"><CompositeEditor /></div>
  </div>
</template>

<style scoped>
.composite-wrap { margin-top: 36px; padding-top: 28px; border-top: 1px solid var(--line); }
</style>
