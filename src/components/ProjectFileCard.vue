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
    <label class="check">
      <input v-model="includeNodes" type="checkbox" />
      <span class="check-label"><strong>{{ t('projectFile.include') }}</strong><small>{{ t('projectFile.includeHint') }}</small></span>
    </label>
    <p v-if="includeNodes" class="notice notice-warning">{{ t('projectFile.includeWarn') }}</p>
    <div class="row">
      <button type="button" class="btn btn-sm" @click="store.exportProjectFile(includeNodes)"><Icon name="FileDown"  />{{ t('projectFile.export') }}</button>
      <button type="button" class="btn btn-sm" @click="input?.click()"><Icon name="FileUp"  />{{ t('projectFile.import') }}</button>
      <span class="spacer"></span>
      <button type="button" class="btn btn-sm btn-danger" @click="clearAll"><Icon name="Trash"  />{{ t('projectFile.clear') }}</button>
      <input ref="input" type="file" accept=".json,application/json" hidden @change="onImport(($event.target as HTMLInputElement).files)" />
    </div>
    <p class="muted small">
      {{ t('projectFile.storage') }}
      <template v-if="store.savedAt">{{ t('projectFile.lastSaved', { time: formatDate(store.savedAt) }) }}</template>
    </p>
  </section>
</template>

<style scoped>
.project-file { display: grid; gap: 10px; }
.project-file .check { padding-inline-start: 0; }
.small { margin: 0; font-size: 12px; }
</style>
