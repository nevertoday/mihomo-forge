<script setup lang="ts">
import { computed } from 'vue'
import { poolText, serviceName, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { BusinessGroup } from '@/types'

/** Simple CSS route tree (spec §28): service → business group → candidate strategies → node pools. */
const props = defineProps<{ business: BusinessGroup }>()
const store = useProjectStore()

const MAX = 8
const label = computed(() => serviceName(props.business.service))
const rows = computed(() =>
  props.business.candidateRefs.map((ref, i) => {
    const s = store.build.strategies.find((x) => x.ref === ref)
    return {
      ref,
      name: props.business.group.proxies[i],
      pool: s ? poolText(s.pool, store.settings.regions) : ref === 'DIRECT' ? t('pool.direct') : ref === 'REJECT' ? t('pool.reject') : '',
      isDefault: i === 0,
    }
  }),
)
const shown = computed(() => rows.value.slice(0, MAX))
</script>

<template>
  <figure class="route" :aria-label="t('route.aria', { service: label })">
    <figcaption class="eyebrow">{{ t('route.title') }}</figcaption>
    <div class="node node-service">
      <span>{{ business.service.icon }} {{ t('route.traffic', { service: label }) }}</span>
      <small dir="ltr">{{ business.service.ruleProviders.map((p) => p.name).join(' · ') || t('route.customRules') }}</small>
    </div>
    <div class="stem" aria-hidden="true"></div>
    <div class="node node-group">
      <span dir="auto">{{ business.group.name }}</span>
      <small>{{ t('route.candidates', { n: rows.length }) }}</small>
    </div>
    <div class="stem" aria-hidden="true"></div>
    <ul class="branches">
      <li v-for="r in shown" :key="r.ref" :class="{ 'is-default': r.isDefault }">
        <div class="node node-leaf">
          <span><bdi>{{ r.name }}</bdi><span v-if="r.isDefault" class="xxd-badge" data-variant="solid">{{ t('route.default') }}</span></span>
          <small>{{ r.pool }}</small>
        </div>
      </li>
      <li v-if="rows.length > MAX" class="more muted">{{ t('route.more', { n: rows.length - MAX }) }}</li>
    </ul>
  </figure>
</template>

<style scoped>
.route { margin: 0; padding: var(--space-4); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--paper); }
.route .eyebrow { margin: 0 0 var(--space-3); }
.node { display: grid; gap: var(--space-0-5); padding: var(--space-2) var(--space-3); border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--paper); }
.node span { display: flex; align-items: center; gap: var(--space-1-5); font: var(--weight-medium) var(--text-sm) / var(--leading-sm) var(--font-body); }
.node small { color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-xs); text-align: start; }
/* The group is the one the user picks from in OpenClash: a quiet fill, not a solid block. */
.node-group { border-color: var(--line-strong); background: var(--wash); }
.stem { width: 1px; height: var(--space-4); margin-inline-start: var(--space-5); background: var(--line-strong); }
.branches { position: relative; display: grid; gap: var(--space-1-5); margin: 0; padding: 0; padding-inline-start: var(--space-5); list-style: none; }
.branches::before { content: ""; position: absolute; inset-inline-start: var(--space-5); top: 0; bottom: 18px; width: 1px; background: var(--line-strong); }
.branches li { position: relative; padding-inline-start: var(--space-4); }
.branches li::before { content: ""; position: absolute; inset-inline-start: 0; top: 18px; width: var(--space-4); height: 1px; background: var(--line-strong); }
.is-default .node-leaf { background: var(--selected-bg); }
.more { padding-top: var(--space-0-5); font-size: var(--text-xs); }
</style>
