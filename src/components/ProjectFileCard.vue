<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref } from 'vue'
import { askConfirm } from '@/app/confirm'
import { formatDate, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const includeNodes = ref(false)
const input = ref<HTMLInputElement>()

async function onImport(list: FileList | null) {
  const f = list?.[0]
  if (f) await store.importProjectFile(f)
  if (input.value) input.value.value = ''
}

async function clearAll() {
  if (await askConfirm(t('projectFile.confirmClear'), t('confirm.clear'))) store.clearLocal()
}
</script>

<template>
  <section class="card project-file">
    <h3 class="section-title">{{ t('projectFile.title') }}</h3>
    <p class="section-note">{{ t('projectFile.note') }}</p>
    <label class="xxd-choice">
      <input class="xxd-check" v-model="includeNodes" type="checkbox" />
      <span class="check-label"><strong>{{ t('projectFile.include') }}</strong><small>{{ t('projectFile.includeHint') }}</small></span>
    </label>
    <p v-if="includeNodes" class="xxd-banner" data-tone="warning" data-size="sm">{{ t('projectFile.includeWarn') }}</p>
    <div class="row">
      <button type="button" class="xxd-btn" data-size="sm" @click="store.exportProjectFile(includeNodes)"><Icon name="FileDown" :size="16" /><span>{{ t('projectFile.export') }}</span></button>
      <button type="button" class="xxd-btn" data-size="sm" @click="input?.click()"><Icon name="FileUp" :size="16" /><span>{{ t('projectFile.import') }}</span></button>
      <span class="spacer"></span>
      <button type="button" class="xxd-btn" data-size="sm" data-variant="danger-outline" @click="clearAll"><Icon name="Trash" :size="16" /><span>{{ t('projectFile.clear') }}</span></button>
      <input ref="input" type="file" accept=".json,application/json" hidden @change="onImport(($event.target as HTMLInputElement).files)" />
    </div>
    <p class="muted small">
      {{ t('projectFile.storage') }}
      <template v-if="store.savedAt">{{ t('projectFile.lastSaved', { time: formatDate(store.savedAt) }) }}</template>
    </p>
  </section>
</template>

<style scoped>
.project-file { display: grid; gap: var(--space-3); }
.project-file .section-note { margin-top: calc(-1 * var(--space-2)); }
.small { margin: 0; font-size: var(--text-xs); line-height: var(--leading-sm); }
</style>
