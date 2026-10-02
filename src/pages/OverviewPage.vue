<script setup lang="ts">
import { ArrowRight, Hammer } from 'lucide-vue-next'
import { computed } from 'vue'
import { go } from '@/app/nav'
import { PRESETS } from '@/catalog/presets'
import { MODULES } from '@/catalog/services'
import DropZone from '@/components/DropZone.vue'
import PrivacyNote from '@/components/PrivacyNote.vue'
import ProjectFileCard from '@/components/ProjectFileCard.vue'
import SourceCard from '@/components/SourceCard.vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'

const emit = defineEmits<{ wizard: [] }>()
const store = useProjectStore()
const b = computed(() => store.build)

const ruleSummary = computed(() => {
  const preset = PRESETS.find((p) => p.id === store.settings.rules.preset)?.label
  const mods = MODULES.filter((m) => store.settings.rules.modules.includes(m.id)).map((m) => m.label)
  return [preset, ...mods].join(' + ')
})
const errors = computed(() => b.value.issues.filter((i) => i.level === 'ERROR').length)
const warnings = computed(() => b.value.issues.filter((i) => i.level === 'WARNING').length)
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <p class="eyebrow">{{ t('overview.eyebrow') }}</p>
        <h1 class="page-title" dir="auto">{{ store.settings.name }}</h1>
        <p class="page-lede">
          {{ t('count.sources', { n: store.sources.length }) }} · {{ t('count.nodes', { n: b.stats.nodes }) }} ·
          {{ t('overview.rules', { rules: ruleSummary }) }}
        </p>
      </div>
      <div class="row">
        <button type="button" class="btn" @click="emit('wizard')">{{ t('overview.rerunWizard') }}</button>
        <button type="button" class="btn btn-primary" @click="go('build')"><Hammer />{{ t('overview.rebuild') }}</button>
      </div>
    </header>

    <div class="stack">
      <PrivacyNote />
      <div class="update">
        <div>
          <h2 class="section-title">{{ t('overview.updateTitle') }}</h2>
          <p class="section-note">{{ t('overview.updateNote') }}</p>
        </div>
        <DropZone compact />
      </div>
    </div>

    <section class="section">
      <div class="stats">
        <div class="stat"><strong>{{ b.stats.nodes }}</strong><span>{{ t('overview.statNodes') }}</span></div>
        <div class="stat"><strong>{{ b.stats.duplicates }}</strong><span>{{ t('overview.statDuplicates') }}</span></div>
        <div class="stat"><strong>{{ b.strategies.length }}</strong><span>{{ t('overview.statStrategies') }}</span></div>
        <div class="stat"><strong>{{ b.stats.businessStrategies }}</strong><span>{{ t('overview.statBusiness') }}</span></div>
        <div class="stat"><strong>{{ b.stats.ruleProviders }}</strong><span>{{ t('overview.statProviders') }}</span></div>
        <div class="stat" :class="{ bad: errors }">
          <strong>{{ errors || warnings }}</strong><span>{{ errors ? t('overview.statErrors') : t('overview.statWarnings') }}</span>
        </div>
      </div>
    </section>

    <section v-if="store.sources.length" class="section">
      <div class="section-head">
        <h2 class="section-title">{{ t('overview.sourcesTitle') }}</h2>
        <button type="button" class="btn btn-sm btn-quiet" @click="go('sources')">{{ t('overview.manageSources') }}<ArrowRight class="dir-icon" /></button>
      </div>
      <div class="grid grid-cards">
        <SourceCard v-for="(s, i) in store.sources" :key="s.id" :source="s" :index="i" :total="store.sources.length" :actions="false" />
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">{{ t('overview.businessTitle') }}</h2>
        <button type="button" class="btn btn-sm btn-quiet" @click="go('rules')">{{ t('overview.adjust') }}<ArrowRight class="dir-icon" /></button>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr><th>{{ t('overview.colGroup') }}</th><th>{{ t('overview.colDefault') }}</th><th>{{ t('overview.colOthers') }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="x in b.business" :key="x.service.id">
              <td><strong><bdi>{{ x.group.name }}</bdi></strong></td>
              <td><bdi>{{ x.group.proxies[0] }}</bdi></td>
              <td class="muted">
                <template v-for="(p, i) in x.group.proxies.slice(1)" :key="p"><template v-if="i"> / </template><bdi>{{ p }}</bdi></template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <ProjectFileCard />
    </section>
  </div>
</template>

<style scoped>
.update { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 20px; align-items: center; padding: 18px; border: 1px solid var(--line); background: var(--panel); }
.stat.bad strong { color: var(--notice-error-ink); }
@media (max-width: 760px) { .update { grid-template-columns: 1fr; } }
</style>
