<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import KitDialog from './KitDialog.vue'

const store = useProjectStore()
const item = computed(() => store.pending[0])
const preview = (list: string[]) => list.slice(0, 12)
</script>

<template>
  <KitDialog v-if="item" size="lg" labelledby="replace-title" @close="store.resolvePending('skip')">
    <div class="xxd-dialog__head">
      <h2 id="replace-title" class="xxd-dialog__title">{{ t('replace.title', { name: item.existing.name }) }}</h2>
      <span v-if="store.pending.length > 1" class="xxd-badge">{{ t('replace.more', { n: store.pending.length - 1 }) }}</span>
    </div>
    <div class="xxd-dialog__body">
      <p>{{ t('replace.body', { file: item.incoming.originalFileName }) }}</p>
      <div class="xxd-stats" style="--stat-min: 140px">
        <div class="xxd-stat"><p class="xxd-stat__label">{{ t('replace.oldNodes') }}</p><p class="xxd-stat__value">{{ item.diff.oldCount }}</p></div>
        <div class="xxd-stat"><p class="xxd-stat__label">{{ t('replace.newNodes') }}</p><p class="xxd-stat__value">{{ item.diff.newCount }}</p></div>
      </div>
      <div class="diff">
        <div class="diff-col add">
          <h3><span class="num">+{{ item.diff.added.length }}</span> {{ t('replace.added') }}</h3>
          <ul><li v-for="n in preview(item.diff.added)" :key="n" dir="auto">{{ n }}</li></ul>
          <p v-if="item.diff.added.length > 12" class="more">{{ t('replace.moreItems', { n: item.diff.added.length }) }}</p>
        </div>
        <div class="diff-col del">
          <h3><span class="num">-{{ item.diff.removed.length }}</span> {{ t('replace.removed') }}</h3>
          <ul><li v-for="n in preview(item.diff.removed)" :key="n" dir="auto">{{ n }}</li></ul>
          <p v-if="item.diff.removed.length > 12" class="more">{{ t('replace.moreItems', { n: item.diff.removed.length }) }}</p>
        </div>
        <div class="diff-col ren">
          <h3><span class="num">~{{ item.diff.renamed.length }}</span> {{ t('replace.renamed') }}</h3>
          <ul><li v-for="r in item.diff.renamed.slice(0, 12)" :key="r.from + r.to" dir="auto">{{ r.from }} → {{ r.to }}</li></ul>
        </div>
      </div>
    </div>
    <div class="xxd-dialog__actions">
      <button type="button" class="xxd-btn ui-dialog-cancel" @click="store.resolvePending('skip')">{{ t('common.cancel') }}</button>
      <button type="button" class="xxd-btn" @click="store.resolvePending('add')">{{ t('replace.addAsNew') }}</button>
      <button type="button" class="xxd-btn" data-variant="primary" @click="store.resolvePending('replace')">{{ t('replace.confirm', { name: item.existing.name }) }}</button>
    </div>
  </KitDialog>
</template>

<style scoped>
/* Three columns side by side, separated by space, not boxes. */
.diff { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4); }
.diff-col h3 { margin: 0 0 var(--space-1); color: var(--ink); font: var(--weight-medium) var(--text-sm) / var(--leading-sm) var(--font-body); }
.diff-col ul { margin: 0; padding: 0; list-style: none; font-size: var(--text-xs); line-height: var(--leading-sm); }
.diff-col li { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.more { margin: var(--space-1) 0 0; font-size: var(--text-xs); }
.num { font-variant-numeric: tabular-nums; }
.add .num { color: var(--success); }
.del .num { color: var(--danger); }
.ren .num { color: var(--warning); }
@media (max-width: 480px) { .diff { grid-template-columns: minmax(0, 1fr); } }
</style>
