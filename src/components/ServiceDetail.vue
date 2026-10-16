<script setup lang="ts">
import { plain } from '@/utils/plain'
import Icon from '@/components/Icon.vue'
import { computed } from 'vue'
import { currentSetting, editableSetting, optionName, strategyOptionGroups } from '@/app/business'
import { providerUrl } from '@/catalog/ruleProviders'
import { serviceGroupName } from '@/core/strategies'
import { serviceName, t, tDynamic } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { ModuleId, RuleService } from '@/types'
import RoutePreview from './RoutePreview.vue'

const props = defineProps<{ service: RuleService; enabled: boolean }>()
const store = useProjectStore()

const moduleLabel = computed(() =>
  props.service.module === 'base' ? t('modules.base') : t(`moduleNames.${props.service.module as Exclude<ModuleId, 'base'>}`),
)
const description = computed(() => tDynamic(`serviceDesc.${props.service.id}`))
const groups = computed(() => strategyOptionGroups(store.build, store.settings.regions).filter((g) => g.options.length))
const setting = computed(() => currentSetting(props.service, store.settings, store.build))
const customised = computed(() => !!store.settings.business[props.service.id])
const checked = computed(() => new Set(setting.value.candidates))
const built = computed(() => store.build.business.find((b) => b.service.id === props.service.id))

function toggle(ref: string) {
  const s = editableSetting(props.service, store.settings, store.build)
  if (s.candidates.includes(ref)) {
    s.candidates = s.candidates.filter((r) => r !== ref)
    if (s.defaultRef === ref) s.defaultRef = s.candidates[0] ?? 'DIRECT'
  } else {
    s.candidates = [...s.candidates, ref]
  }
}

function setDefault(ref: string) {
  const s = editableSetting(props.service, store.settings, store.build)
  s.defaultRef = ref
  if (!s.candidates.includes(ref)) s.candidates = [ref, ...s.candidates]
}

function reset() {
  delete store.settings.business[props.service.id]
}
</script>

<template>
  <article class="detail">
    <header class="detail-head">
      <p class="eyebrow">{{ moduleLabel }}{{ service.optional ? ` · ${t('service.optional')}` : '' }}</p>
      <h2 class="detail-title">{{ serviceName(service) }}</h2>
      <p v-if="description" class="section-note">{{ description }}</p>
      <p v-if="!enabled" class="xxd-banner" data-tone="warning">{{ t('service.notEnabled') }}</p>
    </header>

    <div class="detail-grid">
      <div class="detail-main">
        <template v-if="service.fixedTarget">
          <p class="xxd-banner">{{ t('service.fixed', { target: service.fixedTarget }) }}</p>
        </template>
        <template v-else>
          <div class="xxd-field">
            <span class="xxd-label">{{ t('service.defaultLabel') }}</span>
            <span class="xxd-select"><select  :value="setting.defaultRef" @change="setDefault(($event.target as HTMLSelectElement).value)">
              <option v-for="ref in setting.candidates" :key="ref" :value="ref">{{ plain(optionName(ref, store.build)) }}</option>
            </select></span>
            <small class="xxd-help">{{ t('service.defaultHint', { group: plain(serviceGroupName(service, store.settings.outputLocale)) }) }}</small>
          </div>

          <div class="candidates">
            <div class="row cand-head">
              <strong>{{ t('service.allowed') }}</strong>
              <span class="spacer"></span>
              <button v-if="customised" type="button" class="xxd-btn" data-size="sm" data-variant="ghost" @click="reset"><Icon name="RotateCcw" :size="16" /><span>{{ t('common.reset') }}</span></button>
            </div>
            <fieldset v-for="g in groups" :key="g.id" class="cand-group">
              <legend>{{ g.label }}</legend>
              <label v-for="o in g.options" :key="o.ref" class="xxd-choice">
                <input class="xxd-check" type="checkbox" :checked="checked.has(o.ref)" @change="toggle(o.ref)" />
                <span class="check-label"><strong dir="auto">{{ plain(o.name) }}</strong><small>{{ o.pool }}</small></span>
              </label>
            </fieldset>
            <p v-if="!groups.some((g) => g.id !== 'general')" class="muted">{{ t('service.noStrategies') }}</p>
          </div>
        </template>

        <div class="rulesets">
          <strong>{{ t('service.ruleSources') }}</strong>
          <ul dir="ltr">
            <li v-for="p in service.ruleProviders" :key="p.name">
              <code>RULE-SET,{{ p.name }}</code>
              <a class="muted mono" :href="providerUrl(p, store.settings.rules.mirror)" target="_blank" rel="noopener">{{ p.behavior }} · {{ p.path }}</a>
            </li>
            <li v-for="r in service.extraRules ?? []" :key="r"><code>{{ r }}</code></li>
          </ul>
        </div>
      </div>

      <aside class="detail-side">
        <RoutePreview v-if="built" :business="built" />
        <div v-else-if="service.fixedTarget" class="card card-quiet muted">{{ serviceName(service) }} → {{ service.fixedTarget }}</div>
      </aside>
    </div>
  </article>
</template>

<style scoped>
.detail { display: grid; gap: var(--space-5); }
.detail-head { display: grid; gap: var(--space-1); }
.detail-head .eyebrow { margin: 0; }
.detail-title { margin: 0; font: var(--weight-strong) var(--text-xxl) / var(--leading-xl) var(--font-title); }
.detail-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 340px); gap: var(--space-6); align-items: start; }
.detail-main { display: grid; gap: var(--space-5); }
.candidates { display: grid; gap: var(--space-3); }
.cand-head { min-height: var(--control-h-sm); }
.cand-group { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-2) var(--space-3); margin: 0; padding: var(--space-1) 0 0; border: 0; }
.cand-group legend { margin-bottom: var(--space-1); padding: 0; color: var(--muted); font: var(--weight-medium) var(--text-xs) / var(--leading-xs) var(--font-body); }
.rulesets ul { display: grid; gap: var(--space-1); margin: var(--space-1-5) 0 0; padding: 0; list-style: none; font-size: var(--text-xs); text-align: start; }
.rulesets li { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--space-2); }
.rulesets a { font-size: var(--text-xs); text-decoration: none; }
.rulesets a:hover { color: var(--ink); text-decoration: underline; }
.detail-side { position: sticky; top: var(--space-4); }
@media (max-width: 1024px) { .detail-grid { grid-template-columns: minmax(0, 1fr); } .detail-side { position: static; } }
</style>
