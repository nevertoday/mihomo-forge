<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppFooter from '@/components/AppFooter.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import NoticeRegion from '@/components/NoticeRegion.vue'
import ReplaceDialog from '@/components/ReplaceDialog.vue'
import { t } from '@/i18n'
import AdvancedPage from '@/pages/AdvancedPage.vue'
import HomePage from '@/pages/HomePage.vue'
import { useProjectStore } from '@/stores/project'
import AppTopbar from './AppTopbar.vue'
import { currentView } from './nav'

const store = useProjectStore()
const dragging = ref(false)

onMounted(() => store.restore())

// Dropping YAML anywhere imports it: updating snapshots is the everyday task.
let depth = 0
const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes('Files')
function onDragEnter(e: DragEvent) {
  if (!hasFiles(e)) return
  depth++
  dragging.value = true
}
function onDragLeave(e: DragEvent) {
  if (!hasFiles(e)) return
  depth = Math.max(0, depth - 1)
  if (!depth) dragging.value = false
}
function onDragOver(e: DragEvent) {
  if (hasFiles(e)) e.preventDefault()
}
function onDrop(e: DragEvent) {
  if (!hasFiles(e)) return
  depth = 0
  dragging.value = false
  // A DropZone already handled it (it calls preventDefault).
  if (e.defaultPrevented) return
  e.preventDefault()
  if (e.dataTransfer?.files.length) store.importFiles([...e.dataTransfer.files])
}

onMounted(() => {
  window.addEventListener('dragenter', onDragEnter)
  window.addEventListener('dragleave', onDragLeave)
  window.addEventListener('dragover', onDragOver)
  window.addEventListener('drop', onDrop)
})
onBeforeUnmount(() => {
  window.removeEventListener('dragenter', onDragEnter)
  window.removeEventListener('dragleave', onDragLeave)
  window.removeEventListener('dragover', onDragOver)
  window.removeEventListener('drop', onDrop)
})
</script>

<template>
  <div class="shell">
    <AppTopbar />
    <NoticeRegion />
    <!-- <main> is the only vertical scroller; the body never scrolls. -->
    <main id="content">
      <template v-if="store.ready">
        <AdvancedPage v-if="currentView === 'advanced'" />
        <HomePage v-else />
      </template>
      <AppFooter />
    </main>
  </div>
  <ReplaceDialog />
  <ConfirmDialog />
  <div v-if="dragging" class="xxd-dropveil drop-veil" data-open aria-hidden="true">{{ t('app.dropVeil') }}</div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
}
main {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}
/* The kit's drop veil, pinned to the window: dropping YAML anywhere imports it. */
.drop-veil { position: fixed; pointer-events: none; }
</style>
