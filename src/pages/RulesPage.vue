<script setup lang="ts">
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
        <p class="eyebrow">{{ t('rulesPage.eyebrow') }}</p>
        <h1 class="page-title">{{ t('nav.rules') }}</h1>
        <p class="page-lede">{{ t('rulesPage.lede') }}</p>
      </div>
      <p class="chip chip-dark">{{ t('count.services', { n: enabledIds.size }) }} · {{ t('count.rules', { n: store.build.stats.rules }) }}</p>
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
              <span class="svc-name">{{ s.icon }} {{ serviceName(s) }}<small v-if="s.optional" class="opt">{{ t('service.optional') }}</small></span>
              <small class="svc-default"><bdi>{{ enabledIds.has(s.id) ? (s.fixedTarget ?? defaultName(s.id) ?? '') : t('rulesPage.notEnabled') }}</bdi></small>
            </button>
            <span v-if="s.required" class="always">{{ t('rulesPage.alwaysOn') }}</span>
            <button
              v-else
              type="button"
              class="switch"
              role="switch"
              :aria-checked="enabledIds.has(s.id)"
              :aria-label="enabledIds.has(s.id) ? t('rulesPage.disable', { name: serviceName(s) }) : t('rulesPage.enable', { name: serviceName(s) })"
              @click="toggle(s)"
            ></button>
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
.services-layout { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 28px; align-items: start; }
.service-list { position: sticky; top: calc(var(--topbar-height) + 16px); max-height: calc(100dvh - var(--topbar-height) - 40px); overflow: auto; border: 1px solid var(--line); background: var(--panel); padding: 12px 0; }
.svc-section { padding: 0 8px 10px; }
.svc-section .eyebrow { margin: 6px 8px 4px; }
.svc { display: flex; align-items: center; gap: 6px; padding-inline-end: 6px; border-inline-start: 2px solid transparent; }
.svc.is-active { background: var(--active-wash); border-inline-start-color: var(--ink); }
.svc-main { flex: 1; min-width: 0; display: grid; gap: 0; padding: 6px 8px; border: 0; background: transparent; text-align: start; }
.svc-name { font-weight: 600; color: var(--muted); display: flex; align-items: center; gap: 6px; }
.svc.is-on .svc-name { color: var(--ink); }
.svc-default { color: var(--muted); font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.opt { font-size: 10px; font-weight: 800; padding: 0 4px; border: 1px solid var(--line-strong); color: var(--muted); }
.switch { position: relative; flex: none; width: 30px; height: 18px; padding: 0; border: 1.5px solid var(--line-strong); background: var(--panel); }
.switch::after { content: ""; position: absolute; top: 2px; inset-inline-start: 2px; width: 11px; height: 11px; background: var(--line-strong); transition: transform 140ms ease; }
.switch[aria-checked="true"] { border-color: var(--ink); background: var(--ink); }
.switch[aria-checked="true"]::after { transform: translateX(12px); background: var(--paper); }
[dir="rtl"] .switch[aria-checked="true"]::after { transform: translateX(-12px); }
.always { flex: none; font-size: 11px; font-weight: 700; color: var(--muted); }
@media (max-width: 860px) {
  .services-layout { grid-template-columns: 1fr; }
  .service-list { position: static; max-height: 320px; }
}
</style>
