<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { computed } from 'vue'
import { SERVICE_BY_ID } from '@/catalog/services'
import { issueText, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { IssueLevel } from '@/types'

defineProps<{ hideVerdict?: boolean }>()
const store = useProjectStore()
const b = computed(() => store.build)
const errors = computed(() => b.value.issues.filter((i) => i.level === 'ERROR'))
const refErrors = computed(() => errors.value.filter((i) => ['missing-ref', 'rule-target', 'match-target', 'missing-rule-provider', 'self-ref'].includes(i.code)))
const nameErrors = computed(() => errors.value.filter((i) => ['dup-proxy', 'dup-group', 'name-clash', 'reserved-name'].includes(i.code)))

const checklist = computed(() => {
  const s = b.value.stats
  return [
    { ok: s.sources > 0, text: t('report.sources', { n: s.sources }) },
    { ok: s.nodes > 0, text: t('report.nodes', { n: s.nodes }) },
    { ok: true, text: t('report.duplicates', { n: s.duplicates }) },
    { ok: true, text: t('report.regions', { n: s.regionStrategies }) },
    { ok: true, text: t('report.sourceGroups', { n: s.sourceStrategies }) },
    ...(s.compositeStrategies ? [{ ok: true, text: t('report.composites', { n: s.compositeStrategies }) }] : []),
    ...(s.filterStrategies ? [{ ok: true, text: t('report.filters', { n: s.filterStrategies }) }] : []),
    { ok: true, text: t('report.business', { n: s.businessStrategies }) },
    { ok: true, text: `${t('report.providers', { n: s.ruleProviders })} · ${t('report.rules', { n: s.rules })}` },
    { ok: !refErrors.value.length, text: refErrors.value.length ? t('report.refsBad', { n: refErrors.value.length }) : t('report.refsOk') },
    { ok: !nameErrors.value.length, text: nameErrors.value.length ? t('report.namesBad', { n: nameErrors.value.length }) : t('report.namesOk') },
  ]
})

const ORDER: IssueLevel[] = ['ERROR', 'WARNING', 'INFO']
const issues = computed(() => [...b.value.issues].sort((x, y) => ORDER.indexOf(x.level) - ORDER.indexOf(y.level)))
</script>

<template>
  <div class="report">
    <ul class="checklist">
      <li v-for="c in checklist" :key="c.text" :class="{ bad: !c.ok }">
        <Icon v-if="c.ok" name="Check" :size="16" /><Icon v-else name="CircleX" :size="16" />
        <span>{{ c.text }}</span>
      </li>
    </ul>
    <p v-if="!hideVerdict" class="verdict" :class="b.ok ? 'ok' : 'bad'">{{ b.ok ? t('report.ok') : t('report.bad') }}</p>

    <ul v-if="issues.length" class="issues">
      <li v-for="(i, idx) in issues" :key="idx" class="xxd-banner" data-size="sm" :data-tone="i.level === 'ERROR' ? 'danger' : i.level === 'WARNING' ? 'warning' : undefined">
        <Icon v-if="i.level === 'ERROR'" name="CircleX" :size="16" />
        <Icon v-else-if="i.level === 'WARNING'" name="TriangleAlert" :size="16" />
        <Icon v-else name="Info" :size="16" />
        <p class="xxd-banner__text"><span class="level">{{ t(`report.${i.level}`) }}</span> {{ issueText(i, SERVICE_BY_ID) }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.report { display: grid; gap: var(--space-4); }
/* Results read as a list of marks, not a grid of boxes. */
.checklist { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-2) var(--space-4); margin: 0; padding: 0; list-style: none; }
.checklist li { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); line-height: var(--leading-sm); }
.checklist :deep(.ui-icon) { flex: none; color: var(--success); }
.checklist li.bad, .checklist li.bad :deep(.ui-icon) { color: var(--danger); }
.verdict { margin: 0; font: var(--weight-strong) var(--text-xl) / var(--leading-lg) var(--font-title); }
.verdict.ok { color: var(--success); }
.verdict.bad { color: var(--danger); }
.issues { display: grid; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
.level { font-weight: var(--weight-medium); }
</style>
