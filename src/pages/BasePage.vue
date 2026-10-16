<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { computed, ref } from 'vue'
import { stringify } from 'yaml'
import { DEFAULT_REGIONS, OTHER_REGION_ID } from '@/catalog/regions'
import { MIRRORS } from '@/catalog/ruleProviders'
import { invalidPatterns } from '@/core/regions'
import { exampleGroupName, LOCALES, regionName, t } from '@/i18n'
import { BASE_TEMPLATES } from '@/templates/base'
import { useProjectStore } from '@/stores/project'
import type { MirrorId } from '@/types'

const store = useProjectStore()
const base = computed(() => store.settings.base)
const strat = computed(() => store.settings.strategy)
const fileInput = ref<HTMLInputElement>()
const showRegions = ref(false)

const TEMPLATES = computed(() => [
  { id: 'openclash-standard', label: t('basePage.tplOpenclash'), description: t('basePage.tplOpenclashDesc') },
  { id: 'mihomo-generic', label: t('basePage.tplGeneric'), description: t('basePage.tplGenericDesc') },
  { id: 'custom', label: t('basePage.tplCustom'), description: t('basePage.tplCustomDesc') },
])

const preview = computed(() =>
  base.value.templateId === 'custom' ? '' : stringify(BASE_TEMPLATES[base.value.templateId], { indent: 2, aliasDuplicateObjects: false }),
)

async function importBase(list: FileList | null) {
  const f = list?.[0]
  if (!f) return
  base.value.customYaml = await f.text()
  base.value.templateId = 'custom'
  if (fileInput.value) fileInput.value.value = ''
}

function startFromTemplate() {
  const id = base.value.templateId === 'custom' ? 'openclash-standard' : base.value.templateId
  base.value.customYaml = stringify(BASE_TEMPLATES[id], { indent: 2, aliasDuplicateObjects: false })
  base.value.templateId = 'custom'
}

const editableRegions = computed(() => store.settings.regions.filter((r) => r.id !== OTHER_REGION_ID))
const bad = computed(() => new Set(invalidPatterns(store.settings.regions).map((b) => `${b.regionId}|${b.pattern}`)))

function setPatterns(id: string, text: string) {
  const r = store.settings.regions.find((x) => x.id === id)
  if (r) r.patterns = text.split('\n').map((s) => s.trim()).filter(Boolean)
}

function resetRegion(id: string) {
  const d = DEFAULT_REGIONS.find((x) => x.id === id)
  const r = store.settings.regions.find((x) => x.id === id)
  if (d && r) {
    r.patterns = [...d.patterns]
    r.priority = d.priority
  }
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">{{ t('nav.base') }}</h1>
        <p class="page-lede">{{ t('basePage.lede') }}</p>
      </div>
    </header>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">{{ t('basePage.outputTitle') }}</h2>
        <p class="section-note">{{ t('basePage.outputNote', { example: exampleGroupName(store.settings.outputLocale) }) }}</p>
      </div>
      <div class="grid locales">
        <label v-for="l in LOCALES" :key="l.id" class="xxd-choice card-check">
          <input class="xxd-radio" v-model="store.settings.outputLocale" type="radio" name="output-locale" :value="l.id" />
          <span class="check-label"><strong :lang="l.id">{{ l.name }}</strong><small :dir="l.dir">{{ exampleGroupName(l.id) }}</small></span>
        </label>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">{{ t('basePage.templateTitle') }}</h2></div>
      <div class="grid templates">
        <label v-for="tpl in TEMPLATES" :key="tpl.id" class="xxd-choice card-check">
          <input class="xxd-radio" v-model="base.templateId" type="radio" name="template" :value="tpl.id" />
          <span class="check-label"><strong>{{ tpl.label }}</strong><small>{{ tpl.description }}</small></span>
        </label>
      </div>

      <div v-if="base.templateId === 'custom'" class="stack custom">
        <div class="row">
          <button type="button" class="xxd-btn" data-size="sm" @click="fileInput?.click()"><Icon name="FileUp" :size="16" /><span>{{ t('basePage.importBase') }}</span></button>
          <button type="button" class="xxd-btn" data-size="sm" data-variant="ghost" @click="startFromTemplate">{{ t('basePage.fromTemplate') }}</button>
          <input ref="fileInput" type="file" accept=".yaml,.yml" hidden @change="importBase(($event.target as HTMLInputElement).files)" />
        </div>
        <textarea v-model="base.customYaml" class="xxd-textarea" dir="ltr" rows="16" spellcheck="false" placeholder="mixed-port: 7890&#10;dns:&#10;  enable: true"></textarea>
        <label class="xxd-choice">
          <input class="xxd-check" v-model="base.mergeCustomRules" type="checkbox" />
          <span class="check-label"><strong>{{ t('basePage.mergeRules') }}</strong><small>{{ t('basePage.mergeRulesHint') }}</small></span>
        </label>
      </div>
      <details v-else class="preview">
        <summary>{{ t('basePage.viewTemplate') }}</summary>
        <pre class="xxd-code" dir="ltr">{{ preview }}</pre>
      </details>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">{{ t('basePage.testTitle') }}</h2><p class="section-note">{{ t('basePage.testNote') }}</p></div>
      <div class="grid params">
        <label class="xxd-field"><span class="xxd-label">{{ t('basePage.testUrl') }}</span><input v-model.trim="strat.testUrl" class="xxd-input mono" dir="ltr" /></label>
        <label class="xxd-field"><span class="xxd-label">{{ t('basePage.interval') }}</span><input v-model.number="strat.interval" class="xxd-input num" type="number" min="30" step="30" /></label>
        <label class="xxd-field"><span class="xxd-label">{{ t('basePage.tolerance') }}</span><input v-model.number="strat.tolerance" class="xxd-input num" type="number" min="0" step="10" /></label>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2 class="section-title">{{ t('basePage.mirrorTitle') }}</h2><p class="section-note">{{ t('basePage.mirrorNote') }}</p></div>
      <div class="grid templates">
        <label v-for="(m, id) in MIRRORS" :key="id" class="xxd-choice card-check">
          <input class="xxd-radio" v-model="store.settings.rules.mirror" type="radio" name="mirror" :value="id as MirrorId" />
          <span class="check-label"><strong>{{ m.label }}</strong><small class="mono" dir="ltr">{{ m.root }}</small></span>
        </label>
      </div>
      <label class="xxd-choice direct-check">
        <input class="xxd-check" v-model="store.settings.rules.downloadDirect" type="checkbox" />
        <span class="check-label"><strong>{{ t('basePage.downloadDirect') }}</strong><small>{{ t('basePage.downloadDirectHint') }}</small></span>
      </label>
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">{{ t('basePage.regionsTitle') }}</h2>
        <button type="button" class="xxd-btn" data-size="sm" :aria-expanded="showRegions" @click="showRegions = !showRegions">
          {{ showRegions ? t('common.collapse') : t('basePage.editRegions') }}
        </button>
      </div>
      <p class="section-note">{{ t('basePage.regionsNote') }}</p>
      <div v-if="showRegions" class="grid regions">
        <div v-for="r in editableRegions" :key="r.id" class="card region-card">
          <div class="row">
            <strong>{{ r.icon }} {{ regionName(r) }}</strong>
            <span class="spacer"></span>
            <label class="prio"><span class="muted">{{ t('basePage.priority') }}</span><input v-model.number="r.priority" class="xxd-input num" type="number" /></label>
            <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only :aria-label="t('common.reset')" :title="t('common.reset')" @click="resetRegion(r.id)"><Icon name="RotateCcw" :size="16" /></button>
          </div>
          <textarea class="xxd-textarea" dir="ltr" rows="5" spellcheck="false" :value="r.patterns.join('\n')" @change="setPatterns(r.id, ($event.target as HTMLTextAreaElement).value)"></textarea>
          <p v-for="p in r.patterns.filter((p) => bad.has(`${r.id}|${p}`))" :key="p" class="bad">{{ t('basePage.invalidPattern', { pattern: p }) }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.templates { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-2); }
.locales { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: var(--space-2); }
.card-check small.mono { word-break: break-all; }
.custom { margin-top: var(--space-3); }
.direct-check { margin-top: var(--space-3); }
.preview { margin-top: var(--space-2); }
.preview .xxd-code { max-height: 420px; overflow: auto; }
.params { grid-template-columns: 2fr 1fr 1fr; }
.regions { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); margin-top: var(--space-3); }
.region-card { display: grid; gap: var(--space-2); padding: var(--space-3); }
.region-card .xxd-textarea { min-height: 110px; }
.prio { display: flex; align-items: center; gap: var(--space-1-5); font-size: var(--text-xs); }
.prio .xxd-input { width: 72px; }
.bad { margin: 0; color: var(--danger); font-size: var(--text-xs); }
@media (max-width: 640px) { .params { grid-template-columns: minmax(0, 1fr); } }
</style>
