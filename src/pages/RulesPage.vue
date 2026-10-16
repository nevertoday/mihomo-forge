<script setup lang="ts">
import { plain } from '@/utils/plain'
import { computed, ref } from 'vue'
import { resolveServices } from '@/catalog/presets'
import { ALL_SERVICES } from '@/catalog/services'
import PresetPicker from '@/components/PresetPicker.vue'
import ServiceDetail from '@/components/ServiceDetail.vue'
import { serviceName, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { ModuleId, RuleService } from '@/types'

const store = useProjectStore()
const rules = computed(() => store.settings.rules)
const enabledIds = computed(() => new Set(resolveServices(rules.value).map((s) => s.id)))
const selectedId = ref('chatgpt')
const selected = computed(() => ALL_SERVICES.find((s) => s.id === selectedId.value) ?? ALL_SERVICES[0])
const defaultName = (id: string) => store.build.business.find((b) => b.service.id === id)?.group.proxies[0]

const sections = computed(() => {
  const label = (m: ModuleId) => (m === 'base' ? t('modules.base') : t(`moduleNames.${m as Exclude<ModuleId, 'base'>}`))
  const order: ModuleId[] = ['base', 'ads', 'ai', 'developer', 'streaming', 'social', 'gaming', 'crypto']
  return order.map((m) => ({ id: m, label: label(m), services: ALL_SERVICES.filter((s) => s.module === m) }))
})

function toggle(service: RuleService) {
  if (service.required) return
  const r = rules.value
  const on = enabledIds.value.has(service.id)
  r.extraServices = r.extraServices.filter((id) => id !== service.id)
  r.disabledServices = r.disabledServices.filter((id) => id !== service.id)
  // Recompute what the preset + modules alone would give, then record only the difference.
  const byPreset = new Set(resolveServices({ ...r, extraServices: [], disabledServices: [] }).map((s) => s.id))
  if (on && byPreset.has(service.id)) r.disabledServices.push(service.id)
  if (!on && !byPreset.has(service.id)) r.extraServices.push(service.id)
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">{{ t('nav.rules') }}</h1>
        <p class="page-lede">{{ t('rulesPage.lede') }}</p>
      </div>
      <p class="xxd-badge">{{ t('count.services', { n: enabledIds.size }) }} · {{ t('count.rules', { n: store.build.stats.rules }) }}</p>
    </header>

    <section class="section">
      <PresetPicker />
    </section>

    <section class="section services-layout">
      <nav class="service-list" :aria-label="t('rulesPage.listLabel')">
        <div v-for="sec in sections" :key="sec.id" class="svc-section">
          <p class="eyebrow">{{ sec.label }}</p>
          <div
            v-for="s in sec.services"
            :key="s.id"
            class="svc"
            :class="{ 'is-on': enabledIds.has(s.id), 'is-active': selected.id === s.id }"
          >
            <button type="button" class="svc-main" :aria-current="selected.id === s.id ? 'true' : undefined" @click="selectedId = s.id">
              <span class="svc-name">{{ serviceName(s) }}<span v-if="s.optional" class="xxd-badge" data-variant="outline">{{ t('service.optional') }}</span></span>
              <small class="svc-default"><bdi>{{ enabledIds.has(s.id) ? plain(s.fixedTarget ?? defaultName(s.id) ?? '') : t('rulesPage.notEnabled') }}</bdi></small>
            </button>
            <span v-if="s.required" class="always">{{ t('rulesPage.alwaysOn') }}</span>
            <input
              v-else
              type="checkbox"
              class="xxd-switch"
              role="switch"
              data-size="sm"
              :checked="enabledIds.has(s.id)"
              :aria-label="enabledIds.has(s.id) ? t('rulesPage.disable', { name: serviceName(s) }) : t('rulesPage.enable', { name: serviceName(s) })"
              @change="toggle(s)"
            />
          </div>
        </div>
      </nav>
      <div class="service-detail">
        <ServiceDetail :key="selected.id" :service="selected" :enabled="enabledIds.has(selected.id)" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.services-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: var(--space-8); align-items: start; }
.service-list { position: sticky; top: var(--space-4); max-height: calc(100dvh - 56px - var(--space-8)); overflow: auto; padding: var(--space-2); border: 1px solid var(--line); border-radius: var(--r-md); background: var(--paper); }
.svc-section + .svc-section { margin-top: var(--space-3); }
.svc-section .eyebrow { margin: var(--space-1) var(--space-2); }
/* A list: the selected row is one quiet fill (no side bar); enabled names are ink, others muted. */
.svc { display: flex; align-items: center; gap: var(--space-2); padding-inline-end: var(--space-2); border-radius: var(--r-sm); }
.svc:hover { background: var(--wash); }
.svc.is-active { background: var(--selected-bg); }
.svc-main { flex: 1; display: grid; min-width: 0; padding: var(--space-1-5) var(--space-2); border: 0; background: transparent; color: inherit; font: inherit; text-align: start; cursor: pointer; }
.svc-name { display: flex; align-items: center; gap: var(--space-1-5); color: var(--muted); font: var(--weight-medium) var(--text-sm) / var(--leading-sm) var(--font-body); }
.svc.is-on .svc-name { color: var(--ink); }
.svc-default { overflow: hidden; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-xs); text-overflow: ellipsis; white-space: nowrap; }
.always { flex: none; color: var(--muted); font-size: var(--text-2xs); line-height: var(--leading-xs); }
@media (max-width: 1024px) {
  .services-layout { grid-template-columns: minmax(0, 1fr); }
  .service-list { position: static; max-height: 320px; }
}
</style>
