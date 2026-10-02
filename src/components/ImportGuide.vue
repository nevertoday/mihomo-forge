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
.guide { display: grid; gap: 12px; padding: 18px; border: 1px solid var(--line); background: var(--panel); }
ol { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin: 0; padding: 0; list-style: none; }
li { display: flex; gap: 10px; align-items: flex-start; }
.n { flex: none; display: grid; place-items: center; width: 26px; height: 26px; background: var(--ink); color: var(--paper); font-weight: 700; }
li p { margin: 2px 0 0; line-height: 1.6; }
.core { margin: 0; font-size: 12px; }
@media (max-width: 860px) { ol { grid-template-columns: 1fr; } }
</style>
