<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref } from 'vue'
import BuildReport from '@/components/BuildReport.vue'
import DownloadPanel from '@/components/DownloadPanel.vue'
import DropZone from '@/components/DropZone.vue'
import ImportGuide from '@/components/ImportGuide.vue'
import NodeListDialog from '@/components/NodeListDialog.vue'
import PrivacyNote from '@/components/PrivacyNote.vue'
import PurposeDialog from '@/components/purposes/PurposeDialog.vue'
import PurposeRow from '@/components/purposes/PurposeRow.vue'
import RegionSummary from '@/components/RegionSummary.vue'
import SourceCard from '@/components/SourceCard.vue'
import YamlSheet from '@/components/YamlSheet.vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { Purpose, Source } from '@/types'

const store = useProjectStore()
const viewing = ref<Source | null>(null)
const showYaml = ref(false)
/** undefined: closed · null: new purpose · a purpose: edit it */
const editing = ref<Purpose | null | undefined>(undefined)
</script>

<template>
  <div class="page home">
    <header class="intro">
      <h1 class="page-title">{{ t('home.title') }}</h1>
      <p class="page-lede">{{ t('home.lede') }}</p>
      <PrivacyNote />
    </header>

    <section class="step" aria-labelledby="step-1">
      <header class="step-head">
        <span class="step-n" aria-hidden="true">1</span>
        <div>
          <h2 id="step-1" class="section-title">{{ t('home.step1') }}</h2>
          <p class="section-note">{{ t('home.step1Note') }}</p>
        </div>
      </header>
      <DropZone :compact="store.sources.length > 0" />
      <ul v-if="store.sources.length" class="list sources">
        <SourceCard v-for="(s, i) in store.sources" :key="s.id" :source="s" :index="i" :total="store.sources.length" @view="viewing = $event" />
      </ul>
      <RegionSummary />
    </section>

    <section class="step" aria-labelledby="step-2">
      <header class="step-head">
        <span class="step-n" aria-hidden="true">2</span>
        <div>
          <h2 id="step-2" class="section-title">{{ t('home.step2') }}</h2>
          <p class="section-note">{{ t('home.step2Note') }}</p>
        </div>
      </header>
      <p v-if="!store.sources.length" class="waiting">{{ t('home.step2Empty') }}</p>
      <template v-else>
        <ul class="list purposes">
          <PurposeRow v-for="p in store.settings.purposes" :key="p.id" :purpose="p" @edit="editing = p" />
          <li class="fixed">
            <div>
              <h3>{{ t('purpose.fixedTitle') }}</h3>
              <p>{{ t('purpose.fixedNote') }}</p>
            </div>
            <span class="xxd-badge">{{ t('line.direct') }}</span>
          </li>
        </ul>
        <button type="button" class="xxd-btn add" data-size="sm" @click="editing = null"><Icon name="Plus" :size="16" /><span>{{ t('purpose.add') }}</span></button>
      </template>
    </section>

    <section class="step" aria-labelledby="step-3">
      <header class="step-head">
        <span class="step-n" aria-hidden="true">3</span>
        <div>
          <h2 id="step-3" class="section-title">{{ t('home.step3') }}</h2>
          <p class="section-note">{{ t('home.step3Note') }}</p>
        </div>
      </header>
      <template v-if="store.sources.length">
        <DownloadPanel @view-yaml="showYaml = true" />
        <BuildReport issues-only />
        <ImportGuide />
      </template>
      <p v-else class="waiting">{{ t('home.step3Empty') }}</p>
    </section>

    <NodeListDialog v-if="viewing" :source="viewing" @close="viewing = null" />
    <YamlSheet v-if="showYaml" @close="showYaml = false" />
    <PurposeDialog v-if="editing !== undefined" :purpose="editing ?? undefined" @close="editing = undefined" />
  </div>
</template>

<style scoped>
.home { display: grid; gap: var(--space-8); }
.intro { display: grid; gap: var(--space-2); }
.intro .page-lede { margin: 0; }
.step { display: grid; gap: var(--space-4); }
/* Each step: a number, its title, and what it does — the page reads top to bottom. */
.step-head { display: flex; align-items: flex-start; gap: var(--space-3); }
.step-n { display: grid; place-items: center; flex: none; width: 24px; height: 24px; margin-top: var(--space-0-5); border-radius: var(--r-xs); background: var(--action-fill); color: var(--on-action); font: var(--weight-medium) var(--text-xs) / 1 var(--font-body); }
.waiting { margin: 0; padding: var(--space-4); border: 1px dashed var(--line-strong); border-radius: var(--r-md); color: var(--muted); font-size: var(--text-sm); }
/* Files and purposes are lists: one frame, rows separated by lines between them (not boxes). */
.list { margin: 0; padding: 0 var(--space-4); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--paper); list-style: none; }
.list > :deep(li + li) { border-top: 1px solid var(--line); }
.fixed { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) 0; }
.fixed > div { flex: 1; }
.fixed h3 { margin: 0; font: var(--weight-medium) var(--text-base) / var(--leading-sm) var(--font-body); }
.fixed p { margin: 0; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }
.add { justify-self: start; }
</style>
