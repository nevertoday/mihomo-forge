<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppFooter from '@/components/AppFooter.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import NoticeRegion from '@/components/NoticeRegion.vue'
import ReplaceDialog from '@/components/ReplaceDialog.vue'
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
import { currentView, go, wizardOpen as wizard } from './nav'

const store = useProjectStore()
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
    <NoticeRegion />
    <!-- <main> is the only vertical scroller; the body never scrolls (reference layout rule). -->
    <main id="content">
      <template v-if="store.ready">
        <Wizard v-if="wizard" @finish="finishWizard" />
        <component :is="PAGES[currentView]" v-else @wizard="wizard = true" />
      </template>
      <AppFooter v-if="!wizard" />
    </main>
  </div>
  <ReplaceDialog />
  <ConfirmDialog />
  <div v-if="dragging" class="drop-veil" aria-hidden="true">
    <p>{{ t('app.dropVeil') }}</p>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding-inline-start: var(--rail-width);
  transition: padding-inline-start 280ms cubic-bezier(0.22, 1, 0.36, 1);
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
@media (max-width: 700px) {
  .shell { padding-bottom: calc(60px + env(safe-area-inset-bottom)); }
}
@media (prefers-reduced-motion: reduce) { .shell { transition: none; } }
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
