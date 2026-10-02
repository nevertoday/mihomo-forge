<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, Download, FileCode2, FileUp, Save } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import BuildReport from './BuildReport.vue'
import DropZone from './DropZone.vue'
import NodeListDialog from './NodeListDialog.vue'
import PresetPicker from './PresetPicker.vue'
import PrivacyNote from './PrivacyNote.vue'
import SourceCard from './SourceCard.vue'
import StrategyOptions from './StrategyOptions.vue'
import YamlSheet from './YamlSheet.vue'
import type { Source } from '@/types'

const emit = defineEmits<{ finish: [] }>()
const store = useProjectStore()
const step = ref(store.sources.length ? 2 : 1)
const viewing = ref<Source | null>(null)
const showYaml = ref(false)
const projectInput = ref<HTMLInputElement>()

const STEPS = computed(() =>
  ([1, 2, 3, 4, 5] as const).map((n) => ({ n, title: t(`wizard.s${n}Title`), lede: t(`wizard.s${n}Lede`) })),
)

const current = computed(() => STEPS.value[step.value - 1])
const canNext = computed(() => (step.value === 1 || step.value === 2 ? store.sources.length > 0 : true))

async function onProject(list: FileList | null) {
  const f = list?.[0]
  if (!f) return
  await store.importProjectFile(f)
  if (projectInput.value) projectInput.value.value = ''
  step.value = 2
}

function next() {
  if (step.value < 5) step.value++
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="page wizard">
    <ol class="steps" :aria-label="t('wizard.progress')">
      <li v-for="s in STEPS" :key="s.n" :class="{ done: s.n < step, now: s.n === step }" :aria-current="s.n === step ? 'step' : undefined">
        <button type="button" :disabled="s.n > step && !canNext" @click="s.n <= step || canNext ? (step = s.n) : null">
          <span class="dot num"><Check v-if="s.n < step" />{{ s.n < step ? '' : s.n }}</span>
          <span class="step-title">{{ s.title }}</span>
        </button>
      </li>
    </ol>

    <header class="wiz-head">
      <p class="eyebrow">{{ t('wizard.step', { n: step }) }}</p>
      <h1 class="page-title">{{ current.title }}</h1>
      <p class="page-lede">{{ current.lede }}</p>
    </header>

    <div v-if="step === 1" class="stack">
      <PrivacyNote />
      <DropZone />
      <div v-if="store.sources.length" class="row imported">
        <span class="chip" v-for="s in store.sources" :key="s.id"><bdi>{{ s.name }}</bdi> · <span class="num">{{ s.nodes.length }}</span></span>
      </div>
      <p class="muted alt">
        {{ t('wizard.haveProject') }}
        <button type="button" class="link" @click="projectInput?.click()"><FileUp />{{ t('wizard.importProject') }}</button>
        <input ref="projectInput" type="file" accept=".json" hidden @change="onProject(($event.target as HTMLInputElement).files)" />
      </p>
    </div>

    <div v-else-if="step === 2" class="stack">
      <div class="grid grid-cards">
        <SourceCard v-for="(s, i) in store.sources" :key="s.id" :source="s" :index="i" :total="store.sources.length" @view="viewing = $event" />
      </div>
      <DropZone compact />
    </div>

    <StrategyOptions v-else-if="step === 3" compact />

    <PresetPicker v-else-if="step === 4" />

    <div v-else class="stack">
      <BuildReport />
      <div class="row final">
        <button type="button" class="btn btn-lg btn-primary" :disabled="!store.build.ok" @click="store.downloadConfig()"><Download />{{ t('wizard.download') }}</button>
        <button type="button" class="btn btn-lg" @click="store.save()"><Save />{{ t('topbar.save') }}</button>
        <button type="button" class="btn btn-lg" @click="showYaml = true"><FileCode2 />{{ t('wizard.viewYaml') }}</button>
      </div>
    </div>

    <div class="dock">
      <div class="dock-meta">
        {{ t('count.sourcesShort', { n: store.sources.length }) }} · {{ t('count.nodesShort', { n: store.nodeCount }) }}
      </div>
      <span class="spacer"></span>
      <button v-if="step === 1" type="button" class="btn btn-quiet" @click="emit('finish')">{{ t('wizard.skip') }}</button>
      <button v-if="step > 1" type="button" class="btn btn-quiet" @click="step--"><ArrowLeft class="dir-icon" />{{ t('common.prev') }}</button>
      <button v-if="step < 5" type="button" class="btn btn-primary" :disabled="!canNext" @click="next">{{ t('common.next') }}<ArrowRight class="dir-icon" /></button>
      <button v-else type="button" class="btn btn-primary" @click="emit('finish')">{{ t('wizard.enter') }}<ArrowRight class="dir-icon" /></button>
    </div>

    <NodeListDialog v-if="viewing" :source="viewing" @close="viewing = null" />
    <YamlSheet v-if="showYaml" @close="showYaml = false" />
  </div>
</template>

<style scoped>
.wizard { max-width: 1000px; }
.steps { display: grid; grid-template-columns: repeat(5, 1fr); margin: 0 0 32px; padding: 0; list-style: none; border-top: 1px solid var(--line); }
.steps li { position: relative; }
.steps li.now::before, .steps li.done::before { content: ""; position: absolute; top: -1px; left: 0; right: 0; height: 2px; background: var(--ink); }
.steps li.done::before { opacity: 0.35; }
.steps button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 12px 0 0; padding-inline-end: 8px; border: 0; background: transparent; color: var(--muted); text-align: start; }
.steps .now button, .steps .done button { color: var(--ink); }
.dot { display: grid; place-items: center; flex: none; width: 22px; height: 22px; border: 1.5px solid currentColor; font-size: 12px; font-weight: 700; }
.now .dot { background: var(--ink); border-color: var(--ink); color: var(--paper); }
.dot svg { width: 13px; height: 13px; }
.step-title { font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wiz-head { margin-bottom: 24px; }
.imported { gap: 6px; }
.alt { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 0; }
.link { display: inline-flex; align-items: center; gap: 4px; padding: 0; border: 0; background: none; color: var(--ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.link svg { width: 14px; height: 14px; }
.final { gap: 10px; }
@media (max-width: 760px) { .step-title { display: none; } .steps button { justify-content: center; padding-inline-end: 0; } }
</style>
