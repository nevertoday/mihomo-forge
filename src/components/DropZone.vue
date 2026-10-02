<script setup lang="ts">
import { FileUp } from 'lucide-vue-next'
import { ref } from 'vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'

defineProps<{ compact?: boolean }>()
const store = useProjectStore()
const input = ref<HTMLInputElement>()
const over = ref(false)
const busy = ref(false)

async function take(list: FileList | null | undefined) {
  if (!list?.length) return
  busy.value = true
  try {
    await store.importFiles([...list])
  } finally {
    busy.value = false
    if (input.value) input.value.value = ''
  }
}

function onDrop(e: DragEvent) {
  over.value = false
  take(e.dataTransfer?.files)
}
</script>

<template>
  <div
    class="dropzone"
    :class="{ 'is-over': over, 'is-compact': compact }"
    role="button"
    tabindex="0"
    :aria-label="t('dropzone.label')"
    @click="input?.click()"
    @keydown.enter.prevent="input?.click()"
    @keydown.space.prevent="input?.click()"
    @dragover.prevent="over = true"
    @dragleave.prevent="over = false"
    @drop.prevent="onDrop"
  >
    <FileUp class="dz-icon" aria-hidden="true" />
    <div class="dz-copy">
      <strong>{{ busy ? t('dropzone.busy') : t('dropzone.title') }}</strong>
      <span v-if="!compact">{{ t('dropzone.hint') }}</span>
    </div>
    <input ref="input" type="file" accept=".yaml,.yml,.txt" multiple hidden @change="take(($event.target as HTMLInputElement).files)" />
  </div>
</template>

<style scoped>
.dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 180px;
  padding: 28px;
  border: 1.5px dashed var(--line-strong);
  background: var(--panel);
  cursor: pointer;
  text-align: start;
  transition: border-color 160ms ease, background 160ms ease;
}
.dropzone:hover, .dropzone.is-over { border-color: var(--ink); background: var(--active-wash); }
.dropzone.is-compact { min-height: 72px; padding: 14px 18px; justify-content: flex-start; }
.dz-icon { width: 32px; height: 32px; stroke-width: 1.5; flex: none; }
.is-compact .dz-icon { width: 22px; height: 22px; }
.dz-copy { display: grid; gap: 4px; }
.dz-copy strong { font-size: 16px; }
.is-compact .dz-copy strong { font-size: 14px; }
.dz-copy span { color: var(--muted); font-size: 13px; }
</style>
