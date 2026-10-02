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
          <span><bdi>{{ r.name }}</bdi><em v-if="r.isDefault">{{ t('route.default') }}</em></span>
          <small>{{ r.pool }}</small>
        </div>
      </li>
      <li v-if="rows.length > MAX" class="more muted">{{ t('route.more', { n: rows.length - MAX }) }}</li>
    </ul>
  </figure>
</template>

<style scoped>
.route { margin: 0; padding: 16px; border: 1px solid var(--line); background: var(--panel); }
.route .eyebrow { margin: 0 0 12px; }
.node { display: grid; gap: 2px; padding: 8px 12px; border: 1px solid var(--line-strong); background: var(--paper); }
.node span { font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px; }
.node small { color: var(--muted); font-size: 11.5px; line-height: 1.4; text-align: start; }
.node-group { border-color: var(--ink); background: var(--ink); color: var(--paper); }
.node-group small { color: color-mix(in srgb, var(--paper) 70%, transparent); }
.stem { width: 1px; height: 16px; margin-inline-start: 20px; background: var(--line-strong); }
.branches { position: relative; margin: 0; padding: 0; padding-inline-start: 20px; list-style: none; display: grid; gap: 6px; }
.branches::before { content: ""; position: absolute; inset-inline-start: 20px; top: 0; bottom: 18px; width: 1px; background: var(--line-strong); }
.branches li { position: relative; padding-inline-start: 16px; }
.branches li::before { content: ""; position: absolute; inset-inline-start: 0; top: 18px; width: 16px; height: 1px; background: var(--line-strong); }
.is-default .node-leaf { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }
em { font-style: normal; font-size: 10.5px; font-weight: 800; padding: 0 5px; background: var(--ink); color: var(--paper); }
.more { font-size: 12px; padding-top: 2px; }
</style>
