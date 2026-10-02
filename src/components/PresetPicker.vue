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
      <div class="segmented" role="group" :aria-label="t('preset.scopeLabel')">
        <button v-for="p in PRESETS" :key="p.id" type="button" :aria-pressed="rules.preset === p.id" @click="pickPreset(p.id)">{{ p.label }}</button>
      </div>
      <p class="section-note">{{ t(`presets.${rules.preset}`) }}</p>
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
          <span class="module-copy"><strong>{{ m.label }}</strong><small>{{ t(`modules.${m.id}`) }}</small></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preset-picker { display: grid; gap: 24px; }
.block { display: grid; gap: 8px; justify-items: start; }
.block .eyebrow { margin: 0; }
.modules { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; width: 100%; }
.module {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--line);
  background: var(--panel);
  text-align: start;
}
.module:hover { border-color: var(--line-strong); }
.module[aria-pressed="true"] { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }
.box { flex: none; width: 16px; height: 16px; margin-top: 3px; border: 1.5px solid var(--line-strong); display: grid; place-items: center; }
.module[aria-pressed="true"] .box { border-color: var(--ink); background: var(--ink); }
.module[aria-pressed="true"] .box::after {
  content: "";
  width: 8px;
  height: 4px;
  border-left: 2px solid var(--paper);
  border-bottom: 2px solid var(--paper);
  transform: translateY(-1px) rotate(-45deg);
}
.module-copy { display: grid; gap: 2px; }
.module-copy small { color: var(--muted); font-size: 12px; line-height: 1.45; }
</style>
