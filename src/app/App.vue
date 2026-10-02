<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ReplaceDialog from '@/components/ReplaceDialog.vue'
import ToastStack from '@/components/ToastStack.vue'
import Wizard from '@/components/Wizard.vue'
import { t } from '@/i18n'
import BasePage from '@/pages/BasePage.vue'
import BuildPage from '@/pages/BuildPage.vue'
import OverviewPage from '@/pages/OverviewPage.vue'
import RulesPage from '@/pages/RulesPage.vue'
import SourcesPage from '@/pages/SourcesPage.vue'
import StrategiesPage from '@/pages/StrategiesPage.vue'
import { useProjectStore } from '@/stores/project'
import AppRail from './AppRail.vue'
import AppTopbar from './AppTopbar.vue'
import { currentView, go } from './nav'

const store = useProjectStore()
const wizard = ref(false)
const dragging = ref(false)

const PAGES = {
  overview: OverviewPage,
  sources: SourcesPage,
  strategies: StrategiesPage,
  rules: RulesPage,
  base: BasePage,
  build: BuildPage,
}

onMounted(async () => {
  await store.restore()
  // First visit: guided 5 steps. Returning users land on the workbench (spec §7–8).
  wizard.value = !store.hasSavedProject && !store.sources.length
})

function finishWizard() {
  wizard.value = false
  go('overview')
}

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
  <AppRail />
  <div class="shell">
    <AppTopbar />
    <main v-if="store.ready">
      <Wizard v-if="wizard" @finish="finishWizard" />
      <component :is="PAGES[currentView]" v-else @wizard="wizard = true" />
    </main>
  </div>
  <ReplaceDialog />
  <ToastStack />
  <div v-if="dragging" class="drop-veil" aria-hidden="true">
    <p>{{ t('app.dropVeil') }}</p>
  </div>
</template>

<style scoped>
.shell { min-height: 100dvh; padding-inline-start: var(--rail-width); }
.drop-veil {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: grid;
  place-items: center;
  margin: 12px;
  border: 2px dashed var(--ink);
  background: color-mix(in srgb, var(--bg) 82%, transparent);
  backdrop-filter: blur(4px);
  pointer-events: none;
}
.drop-veil p { margin: 0; font-family: var(--font-title); font-size: 26px; font-weight: 900; }
</style>
