<script setup lang="ts">
import Icon from '@/components/Icon.vue'
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
      <Icon v-if="store.build.ok" name="CircleCheck" :size="24" class="ok-icon" />
      <Icon v-else name="TriangleAlert" :size="24" class="bad-icon" />
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
      <button type="button" class="xxd-btn" data-variant="ghost" @click="emit('view-yaml')"><Icon name="Code" :size="16" /><span>{{ t('buildPage.viewYaml') }}</span></button>
      <button type="button" class="xxd-btn" data-variant="primary" data-size="lg" :disabled="!store.build.ok" @click="store.downloadConfig()">
        <Icon name="Download" :size="16" /><span>{{ t('buildPage.download') }}</span>
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
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--paper);
}
.download.bad { border-color: color-mix(in srgb, var(--danger) 32%, var(--line)); background: color-mix(in srgb, var(--danger) 6%, var(--paper)); }
.status { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
.status :deep(.ui-icon) { flex: none; }
.ok-icon { color: var(--success); }
.bad-icon { color: var(--danger); }
.verdict { margin: 0; font: var(--weight-strong) var(--text-xl) / var(--leading-lg) var(--font-title); }
.bad .verdict { color: var(--danger); }
.meta { margin: var(--space-0-5) 0 0; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }
.actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
</style>
