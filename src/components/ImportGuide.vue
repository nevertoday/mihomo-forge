<script setup lang="ts">
import { t } from '@/i18n'
</script>

<template>
  <section class="guide" :aria-label="t('guide.title')">
    <h3 class="section-title">{{ t('guide.title') }}</h3>
    <ol>
      <li><span class="n num" aria-hidden="true">1</span><p>{{ t('guide.step1') }}</p></li>
      <li><span class="n num" aria-hidden="true">2</span><p>{{ t('guide.step2') }}</p></li>
      <li><span class="n num" aria-hidden="true">3</span><p>{{ t('guide.step3') }}</p></li>
    </ol>
    <p class="muted core">{{ t('guide.core') }}</p>
  </section>
</template>

<style scoped>
.guide { display: grid; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--paper); }
ol { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); margin: 0; padding: 0; list-style: none; }
li { display: flex; align-items: flex-start; gap: var(--space-2); }
.n { flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--r-xs); background: var(--wash-strong); font: var(--weight-medium) var(--text-xs) / 1 var(--font-body); }
li p { margin: 0; font-size: var(--text-sm); line-height: var(--leading-sm); }
.core { margin: 0; font-size: var(--text-xs); line-height: var(--leading-sm); }
@media (max-width: 1024px) { ol { grid-template-columns: minmax(0, 1fr); } }
</style>
