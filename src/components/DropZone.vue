<script setup lang="ts">
import Icon from '@/components/Icon.vue'
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
    class="xxd-dropzone dropzone"
    :class="{ 'is-compact': compact }"
    :data-over="over ? '' : undefined"
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
    <Icon name="FileUp" :size="24" />
    <div class="dz-copy">
      <p class="xxd-dropzone__title">{{ busy ? t('dropzone.busy') : t('dropzone.title') }}</p>
      <p v-if="!compact" class="xxd-help">{{ t('dropzone.hint') }}</p>
    </div>
    <input ref="input" type="file" accept=".yaml,.yml,.txt" multiple hidden @change="take(($event.target as HTMLInputElement).files)" />
  </div>
</template>

<style scoped>
/* The kit's drop zone; compact on pages that already have sources (a one-line target). */
.xxd-dropzone { cursor: pointer; }
.xxd-dropzone:hover { border-color: var(--line-control); background: var(--wash); }
.xxd-dropzone.is-compact { display: flex; justify-content: flex-start; gap: var(--space-3); padding: var(--space-4); text-align: start; }
.dz-copy { display: grid; gap: var(--space-0-5); }
.xxd-dropzone__title, .xxd-help { margin: 0; }
</style>
