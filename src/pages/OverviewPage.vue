<script setup lang="ts">
import { plain } from '@/utils/plain'
import Icon from '@/components/Icon.vue'
import { computed } from 'vue'
import { go } from '@/app/nav'
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
  const preset = t(`presetNames.${store.settings.rules.preset}`)
  const mods = MODULES.filter((m) => store.settings.rules.modules.includes(m.id)).map((m) => t(`moduleNames.${m.id}`))
  return [preset, ...mods].join(' + ')
})
const errors = computed(() => b.value.issues.filter((i) => i.level === 'ERROR').length)
const warnings = computed(() => b.value.issues.filter((i) => i.level === 'WARNING').length)
</script>

<template>
  <div v-if="!store.sources.length" class="page start">
    <header class="page-head">
      <div>
        <h1 class="page-title">{{ t('overview.emptyTitle') }}</h1>
        <p class="page-lede">{{ t('overview.emptyLede') }}</p>
      </div>
    </header>
    <ol class="start-steps">
      <li><span class="n num">1</span>{{ t('overview.empty1') }}</li>
      <li><span class="n num">2</span>{{ t('overview.empty2') }}</li>
      <li><span class="n num">3</span>{{ t('overview.empty3') }}</li>
    </ol>
    <div class="stack">
      <DropZone />
      <PrivacyNote />
      <button type="button" class="xxd-btn start-wizard" @click="emit('wizard')"><Icon name="WandSparkles" :size="16" /><span>{{ t('overview.emptyWizard') }}</span></button>
    </div>
    <section class="section">
      <ProjectFileCard />
    </section>
  </div>

  <div v-else class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title" dir="auto">{{ store.settings.name }}</h1>
        <p class="page-lede">
          {{ t('count.sources', { n: store.sources.length }) }} · {{ t('count.nodes', { n: b.stats.nodes }) }} ·
          {{ t('overview.rules', { rules: ruleSummary }) }}
        </p>
      </div>
      <div class="row">
        <button type="button" class="xxd-btn" data-variant="ghost" @click="emit('wizard')"><Icon name="WandSparkles" :size="16" /><span>{{ t('overview.rerunWizard') }}</span></button>
        <button type="button" class="xxd-btn" @click="go('build')"><span>{{ t('overview.rebuild') }}</span><Icon name="ArrowRight" :size="16" class="dir-icon" /></button>
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
      <div class="xxd-stats stats">
        <div class="xxd-stat"><p class="xxd-stat__label">{{ t('overview.statNodes') }}</p><p class="xxd-stat__value">{{ b.stats.nodes }}</p></div>
        <div class="xxd-stat"><p class="xxd-stat__label">{{ t('overview.statDuplicates') }}</p><p class="xxd-stat__value">{{ b.stats.duplicates }}</p></div>
        <div class="xxd-stat"><p class="xxd-stat__label">{{ t('overview.statStrategies') }}</p><p class="xxd-stat__value">{{ b.strategies.length }}</p></div>
        <div class="xxd-stat"><p class="xxd-stat__label">{{ t('overview.statBusiness') }}</p><p class="xxd-stat__value">{{ b.stats.businessStrategies }}</p></div>
        <div class="xxd-stat"><p class="xxd-stat__label">{{ t('overview.statProviders') }}</p><p class="xxd-stat__value">{{ b.stats.ruleProviders }}</p></div>
        <div class="xxd-stat" :class="{ bad: errors }"><p class="xxd-stat__label">{{ errors ? t('overview.statErrors') : t('overview.statWarnings') }}</p><p class="xxd-stat__value">{{ errors || warnings }}</p>
        </div>
      </div>
    </section>

    <section v-if="store.sources.length" class="section">
      <div class="section-head">
        <h2 class="section-title">{{ t('overview.sourcesTitle') }}</h2>
        <button type="button" class="xxd-btn" data-size="sm" data-variant="ghost" @click="go('sources')"><span>{{ t('overview.manageSources') }}</span><Icon name="ArrowRight" :size="16" class="dir-icon" /></button>
      </div>
      <div class="grid grid-cards">
        <SourceCard v-for="(s, i) in store.sources" :key="s.id" :source="s" :index="i" :total="store.sources.length" :actions="false" />
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2 class="section-title">{{ t('overview.businessTitle') }}</h2>
        <button type="button" class="xxd-btn" data-size="sm" data-variant="ghost" @click="go('rules')"><span>{{ t('overview.adjust') }}</span><Icon name="ArrowRight" :size="16" class="dir-icon" /></button>
      </div>
      <div class="xxd-table-wrap">
        <table class="xxd-table">
          <thead>
            <tr><th>{{ t('overview.colGroup') }}</th><th>{{ t('overview.colDefault') }}</th><th>{{ t('overview.colOthers') }}</th></tr>
          </thead>
          <tbody>
            <tr v-for="x in b.business" :key="x.service.id">
              <td><strong><bdi>{{ plain(x.group.name) }}</bdi></strong></td>
              <td><bdi>{{ plain(x.group.proxies[0]) }}</bdi></td>
              <td class="muted">
                <template v-for="(p, i) in x.group.proxies.slice(1)" :key="p"><template v-if="i"> / </template><bdi>{{ plain(p) }}</bdi></template>
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
.start-steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-3); margin: 0 0 var(--space-6); padding: 0; list-style: none; }
.start-steps li { display: flex; align-items: flex-start; gap: var(--space-2); padding: var(--space-4); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--paper); font: var(--weight-medium) var(--text-sm) / var(--leading-sm) var(--font-body); }
.start-steps .n { flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--r-xs); background: var(--wash-strong); font-size: var(--text-xs); line-height: 1; }
.start-wizard { justify-self: start; }
.update { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: var(--space-5); align-items: center; }
.stats { --stat-min: 140px; }
.xxd-stat.bad .xxd-stat__value { color: var(--danger); }
@media (max-width: 640px) { .start-steps, .update { grid-template-columns: minmax(0, 1fr); } }
</style>
