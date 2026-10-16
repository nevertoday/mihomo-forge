<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { computed, ref } from 'vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import BuildReport from './BuildReport.vue'
import DownloadPanel from './DownloadPanel.vue'
import DropZone from './DropZone.vue'
import ImportGuide from './ImportGuide.vue'
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
  document.getElementById('content')?.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="page wizard">
    <ol class="steps" :aria-label="t('wizard.progress')">
      <li v-for="s in STEPS" :key="s.n" :class="{ done: s.n < step, now: s.n === step }" :aria-current="s.n === step ? 'step' : undefined">
        <button type="button" :disabled="s.n > step && !canNext" @click="s.n <= step || canNext ? (step = s.n) : null">
          <span class="dot num"><Icon v-if="s.n < step" name="Check" :size="14" />{{ s.n < step ? '' : s.n }}</span>
          <span class="step-title">{{ s.title }}</span>
        </button>
      </li>
    </ol>

    <header class="wiz-head">
      <p class="eyebrow">{{ t('wizard.step', { n: step }) }}</p>
      <h1 class="page-title">{{ current.title }}</h1>
      <p class="page-lede">{{ current.lede }}</p>
      <p v-if="step === 3 || step === 4" class="keep-default"><Icon name="Sparkles" :size="14" />{{ t('wizard.keepDefault') }}</p>
    </header>

    <div v-if="step === 1" class="stack">
      <PrivacyNote />
      <DropZone />
      <div v-if="store.sources.length" class="row imported">
        <span class="xxd-badge" v-for="s in store.sources" :key="s.id"><bdi>{{ s.name }}</bdi> · <span class="num">{{ s.nodes.length }}</span></span>
      </div>
      <p class="muted alt">
        {{ t('wizard.haveProject') }}
        <button type="button" class="xxd-link link" @click="projectInput?.click()"><Icon name="FileUp" :size="16" />{{ t('wizard.importProject') }}</button>
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
      <DownloadPanel @view-yaml="showYaml = true" />
      <ImportGuide />
      <details class="xxd-collapse checks">
        <summary>{{ t('buildPage.checksTitle') }}</summary>
        <BuildReport hide-verdict />
      </details>
    </div>

    <div class="xxd-dock dock">
      <div class="xxd-dock__status" role="status" :data-tone="canNext ? undefined : 'warning'">
        <template v-if="!canNext">{{ t('wizard.needFile') }}</template>
        <template v-else>{{ t('count.sourcesShort', { n: store.sources.length }) }} · {{ t('count.nodesShort', { n: store.nodeCount }) }}</template>
      </div>
      <div class="xxd-dock__tools">
        <button v-if="step === 1" type="button" class="xxd-btn" data-variant="ghost" @click="emit('finish')"><span>{{ t('wizard.skip') }}</span></button>
        <button v-if="step > 1" type="button" class="xxd-btn" data-variant="ghost" @click="step--"><Icon name="ArrowLeft" :size="16" class="dir-icon" /><span>{{ t('common.prev') }}</span></button>
      </div>
      <div class="xxd-dock__primary">
        <button v-if="step < 5" type="button" class="xxd-btn" data-variant="primary" :disabled="!canNext" @click="next"><span>{{ t('common.next') }}</span><Icon name="ArrowRight" :size="16" class="dir-icon" /></button>
        <button v-else type="button" class="xxd-btn" data-variant="primary" @click="emit('finish')"><span>{{ t('wizard.enter') }}</span><Icon name="ArrowRight" :size="16" class="dir-icon" /></button>
      </div>
    </div>

    <NodeListDialog v-if="viewing" :source="viewing" @close="viewing = null" />
    <YamlSheet v-if="showYaml" @close="showYaml = false" />
  </div>
</template>

<style scoped>
.wizard { max-width: 1000px; padding-bottom: 140px; }
/* Progress: five steps on one baseline; the current step carries the ink line (like a tab). */
.steps { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); margin: 0 0 var(--space-8); padding: 0; list-style: none; border-top: 1px solid var(--line); }
.steps li { position: relative; }
.steps li.now::before, .steps li.done::before { content: ""; position: absolute; top: -1px; inset-inline: 0; height: 2px; background: var(--action); }
.steps li.done::before { background: var(--line-strong); }
.steps button { display: flex; align-items: center; gap: var(--space-2); width: 100%; padding: var(--space-3) var(--space-2) 0 0; border: 0; background: transparent; color: var(--muted); font: var(--weight-medium) var(--text-sm) / var(--leading-sm) var(--font-body); text-align: start; cursor: pointer; }
.steps button:disabled { color: var(--disabled-ink); cursor: not-allowed; }
.steps .now button, .steps .done button { color: var(--ink); }
.dot { display: grid; place-items: center; flex: none; width: 20px; height: 20px; border: 1px solid currentColor; border-radius: var(--r-xs); font: var(--weight-medium) var(--text-xs) / 1 var(--font-body); }
.now .dot { border-color: var(--action-fill); background: var(--action-fill); color: var(--on-action); }
.step-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.wiz-head { margin-bottom: var(--space-6); }
.imported { gap: var(--space-1-5); }
.alt { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1-5); margin: 0; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }
.link { display: inline-flex; align-items: center; gap: var(--space-1); }
.keep-default { display: inline-flex; align-items: center; gap: var(--space-1-5); margin: var(--space-2) 0 0; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }
@media (max-width: 640px) { .step-title { display: none; } .steps button { justify-content: center; padding-inline-end: 0; } }
</style>
