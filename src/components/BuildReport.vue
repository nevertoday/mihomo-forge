<script setup lang="ts">
import { AlertTriangle, Check, Info, XCircle } from 'lucide-vue-next'
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
        <Check v-if="c.ok" aria-hidden="true" /><XCircle v-else aria-hidden="true" />
        <span>{{ c.text }}</span>
      </li>
    </ul>
    <p v-if="!hideVerdict" class="verdict" :class="b.ok ? 'ok' : 'bad'">{{ b.ok ? t('report.ok') : t('report.bad') }}</p>

    <ul v-if="issues.length" class="issues">
      <li v-for="(i, idx) in issues" :key="idx" class="notice" :class="{ 'notice-error': i.level === 'ERROR', 'notice-warning': i.level === 'WARNING', 'notice-plain': i.level === 'INFO' }">
        <XCircle v-if="i.level === 'ERROR'" aria-hidden="true" />
        <AlertTriangle v-else-if="i.level === 'WARNING'" aria-hidden="true" />
        <Info v-else aria-hidden="true" />
        <span><b>{{ t(`report.${i.level}`) }}</b> {{ issueText(i, SERVICE_BY_ID) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.report { display: grid; gap: 16px; }
.checklist { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); border-top: 1px solid var(--line); border-inline-start: 1px solid var(--line); }
.checklist li { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-inline-end: 1px solid var(--line); border-bottom: 1px solid var(--line); background: var(--panel); font-weight: 600; }
.checklist svg { width: 16px; height: 16px; flex: none; color: var(--notice-success-ink); }
.checklist li.bad { color: var(--notice-error-ink); }
.checklist li.bad svg { color: var(--notice-error-ink); }
.verdict { margin: 0; font-family: var(--font-title); font-size: 22px; font-weight: 900; }
.verdict.ok::before { content: "✓ "; color: var(--notice-success-ink); }
.verdict.bad { color: var(--notice-error-ink); }
.issues { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
</style>
