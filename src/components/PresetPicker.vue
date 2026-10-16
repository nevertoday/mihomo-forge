<script setup lang="ts">
import { FULL_MODULES, PRESETS } from '@/catalog/presets'
import { MODULES } from '@/catalog/services'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { BasePreset, ModuleId } from '@/types'
import { computed } from 'vue'

const store = useProjectStore()
const rules = computed(() => store.settings.rules)

function pickPreset(id: BasePreset) {
  rules.value.preset = id
  // Full turns every module on so the module chips reflect what is generated.
  if (id === 'full') rules.value.modules = [...new Set([...rules.value.modules, ...FULL_MODULES])]
}

function toggleModule(id: ModuleId) {
  const on = rules.value.modules.includes(id)
  rules.value.modules = on ? rules.value.modules.filter((m) => m !== id) : [...rules.value.modules, id]
}
</script>

<template>
  <div class="preset-picker">
    <div class="block">
      <p class="eyebrow">{{ t('preset.scope') }}</p>
      <div class="presets" role="radiogroup" :aria-label="t('preset.scopeLabel')">
        <button
          v-for="p in PRESETS"
          :key="p.id"
          type="button"
          role="radio"
          class="preset"
          :aria-checked="rules.preset === p.id"
          @click="pickPreset(p.id)"
        >
          <span class="preset-head">
            <span class="dot" aria-hidden="true"></span>
            <strong>{{ t(`presetNames.${p.id}`) }}</strong>
            <span v-if="p.id === 'standard'" class="xxd-badge" data-tone="success">{{ t('presetNames.recommended') }}</span>
          </span>
          <small>{{ t(`presets.${p.id}`) }}</small>
        </button>
      </div>
    </div>
    <div class="block">
      <p class="eyebrow">{{ t('preset.modules') }}</p>
      <div class="modules">
        <button
          v-for="m in MODULES"
          :key="m.id"
          type="button"
          class="module"
          :aria-pressed="rules.modules.includes(m.id)"
          @click="toggleModule(m.id)"
        >
          <span class="box" aria-hidden="true"></span>
          <span class="module-copy"><strong>{{ t(`moduleNames.${m.id}`) }}</strong><small>{{ t(`modules.${m.id}`) }}</small></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preset-picker { display: grid; gap: var(--space-6); }
.block { display: grid; gap: var(--space-2); justify-items: start; }
.block .eyebrow { margin: 0; }
.presets, .modules { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: var(--space-2); width: 100%; }
/* Tiles: selection is one quiet fill; the radio / checkbox mark (kit style) says which. */
.preset, .module {
  padding: var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--paper);
  color: var(--ink);
  font: var(--weight-regular) var(--text-sm) / var(--leading-sm) var(--font-body);
  text-align: start;
  cursor: pointer;
  transition: background-color var(--motion-quick) ease;
}
.preset:hover, .module:hover { background: var(--wash); transition-duration: 0s; }
.preset[aria-checked="true"], .module[aria-pressed="true"] { background: var(--selected-bg); }
.preset { display: grid; gap: var(--space-1); }
.preset-head { display: flex; align-items: center; gap: var(--space-2); }
.preset-head strong, .module-copy strong { font-weight: var(--weight-medium); }
.preset small, .module-copy small { color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }
.module { display: flex; align-items: flex-start; gap: var(--space-2); }
.module-copy { display: grid; gap: var(--space-0-5); }
/* Marks drawn like the kit's .xxd-radio / .xxd-check (buttons can't hold real inputs). */
.dot, .box { flex: none; display: grid; place-items: center; width: 16px; height: 16px; border: 1px solid var(--line-control); background: var(--paper); }
.dot { border-radius: var(--r-circle); }
.box { margin-top: var(--space-0-5); border-radius: var(--r-xs); }
.preset[aria-checked="true"] .dot { border-color: var(--action-fill); background: var(--action-fill); }
.preset[aria-checked="true"] .dot::after { content: ""; width: 6px; height: 6px; border-radius: var(--r-circle); background: var(--on-action); }
.module[aria-pressed="true"] .box { border-color: var(--action-fill); background: var(--action-fill); }
.module[aria-pressed="true"] .box::after { content: ""; width: 8px; height: 4px; border-bottom: 1.5px solid var(--on-action); border-left: 1.5px solid var(--on-action); transform: translateY(-1px) rotate(-45deg); }
</style>
