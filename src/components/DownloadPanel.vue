<script setup lang="ts">
import { AlertTriangle, CircleCheck, Download, FileCode2 } from 'lucide-vue-next'
import { computed } from 'vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'

/** The one thing every user came for: the file. Status, size and the button in one place. */
const emit = defineEmits<{ 'view-yaml': [] }>()
const store = useProjectStore()
const size = computed(() => `${(new Blob([store.build.yaml]).size / 1024).toFixed(1)} KB`)
const errors = computed(() => store.build.issues.filter((i) => i.level === 'ERROR').length)
</script>

<template>
  <section class="download" :class="{ bad: !store.build.ok }">
    <div class="status">
      <CircleCheck v-if="store.build.ok" class="ok-icon" aria-hidden="true" />
      <AlertTriangle v-else class="bad-icon" aria-hidden="true" />
      <div>
        <p class="verdict">{{ store.build.ok ? t('report.ok') : t('report.bad') }}</p>
        <p class="meta">
          <span class="mono" dir="ltr">config.yaml · {{ size }}</span> ·
          {{ t('count.sources', { n: store.sources.length }) }} · {{ t('count.nodes', { n: store.build.stats.nodes }) }}
          <template v-if="errors"> · {{ errors }} {{ t('overview.statErrors') }}</template>
        </p>
      </div>
    </div>
    <div class="actions">
      <button type="button" class="btn btn-quiet" @click="emit('view-yaml')"><FileCode2 />{{ t('buildPage.viewYaml') }}</button>
      <button type="button" class="btn btn-primary btn-lg" :disabled="!store.build.ok" @click="store.downloadConfig()">
        <Download />{{ t('buildPage.download') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.download {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--ink);
  background: var(--panel);
}
.download.bad { border-color: var(--notice-error-border); background: var(--notice-error-bg); }
.status { display: flex; align-items: center; gap: 14px; min-width: 0; }
.status svg { flex: none; width: 34px; height: 34px; stroke-width: 1.6; }
.ok-icon { color: var(--notice-success-ink); }
.bad-icon { color: var(--notice-error-ink); }
.verdict { margin: 0; font-family: var(--font-title); font-size: 22px; font-weight: 900; }
.bad .verdict { color: var(--notice-error-ink); }
.meta { margin: 2px 0 0; color: var(--muted); font-size: 13px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
