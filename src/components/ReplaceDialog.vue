<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const item = computed(() => store.pending[0])
const preview = (list: string[]) => list.slice(0, 12)
</script>

<template>
  <div v-if="item" class="overlay">
    <section class="dialog" role="dialog" aria-modal="true" aria-labelledby="replace-title">
      <header class="dialog-head">
        <h2 id="replace-title">{{ t('replace.title', { name: item.existing.name }) }}</h2>
        <span v-if="store.pending.length > 1" class="chip">{{ t('replace.more', { n: store.pending.length - 1 }) }}</span>
      </header>
      <div class="dialog-body stack">
        <p class="muted">{{ t('replace.body', { file: item.incoming.originalFileName }) }}</p>
        <div class="stats">
          <div class="stat"><strong>{{ item.diff.oldCount }}</strong><span>{{ t('replace.oldNodes') }}</span></div>
          <div class="stat"><strong>{{ item.diff.newCount }}</strong><span>{{ t('replace.newNodes') }}</span></div>
        </div>
        <div class="diff">
          <div class="diff-col add">
            <h4><span class="num">+{{ item.diff.added.length }}</span> {{ t('replace.added') }}</h4>
            <ul><li v-for="n in preview(item.diff.added)" :key="n" dir="auto">{{ n }}</li></ul>
            <p v-if="item.diff.added.length > 12" class="muted">{{ t('replace.moreItems', { n: item.diff.added.length }) }}</p>
          </div>
          <div class="diff-col del">
            <h4><span class="num">-{{ item.diff.removed.length }}</span> {{ t('replace.removed') }}</h4>
            <ul><li v-for="n in preview(item.diff.removed)" :key="n" dir="auto">{{ n }}</li></ul>
            <p v-if="item.diff.removed.length > 12" class="muted">{{ t('replace.moreItems', { n: item.diff.removed.length }) }}</p>
          </div>
          <div class="diff-col ren">
            <h4><span class="num">~{{ item.diff.renamed.length }}</span> {{ t('replace.renamed') }}</h4>
            <ul><li v-for="r in item.diff.renamed.slice(0, 12)" :key="r.from + r.to" dir="auto">{{ r.from }} → {{ r.to }}</li></ul>
          </div>
        </div>
      </div>
      <footer class="dialog-foot">
        <button type="button" class="btn" @click="store.resolvePending('skip')">{{ t('common.cancel') }}</button>
        <button type="button" class="btn" @click="store.resolvePending('add')">{{ t('replace.addAsNew') }}</button>
        <button type="button" class="btn btn-primary" @click="store.resolvePending('replace')">{{ t('replace.confirm', { name: item.existing.name }) }}</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.diff { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid var(--line); }
.diff-col { padding: 12px; border-inline-end: 1px solid var(--line); min-width: 0; }
.diff-col:last-child { border-inline-end: 0; }
.diff-col h4 { margin: 0 0 6px; font-size: 13px; }
.diff-col ul { margin: 0; padding: 0; list-style: none; font-size: 12px; color: var(--muted); }
.diff-col li { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.add h4 .num { color: var(--notice-success-ink); }
.del h4 .num { color: var(--notice-error-ink); }
.ren h4 .num { color: var(--notice-warning-ink); }
@media (max-width: 600px) { .diff { grid-template-columns: 1fr; } .diff-col { border-inline-end: 0; border-bottom: 1px solid var(--line); } }
</style>
