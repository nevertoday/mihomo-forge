<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import { copyText } from '@/utils/download'

const emit = defineEmits<{ close: [] }>()
const store = useProjectStore()
const section = ref<'all' | 'proxy-groups' | 'rules' | 'rule-providers' | 'base'>('all')

/** Very large configs are cut in the viewer only; downloads always contain everything. */
const LIMIT = 400_000
const text = computed(() => {
  const yaml = store.build.yaml
  if (section.value === 'all') return yaml
  const lines = yaml.split('\n')
  if (section.value === 'base') {
    const end = lines.findIndex((l) => l.startsWith('proxies:'))
    return lines.slice(0, end < 0 ? undefined : end).join('\n')
  }
  const start = lines.findIndex((l) => l.startsWith(`${section.value}:`))
  if (start < 0) return ''
  const next = lines.findIndex((l, i) => i > start && /^[^\s#-]/.test(l))
  return lines.slice(start, next < 0 ? undefined : next).join('\n')
})
const shown = computed(() => (text.value.length > LIMIT ? `${text.value.slice(0, LIMIT)}\n${t('yaml.truncated')}` : text.value))

async function copy() {
  const ok = await copyText(store.build.yaml)
  store.notify(ok ? t('toast.copied') : t('toast.copyFailed'), ok ? 'success' : 'error')
}

const onKey = (e: KeyboardEvent) => e.key === 'Escape' && emit('close')
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="xxd-panel-scrim" data-open @click="emit('close')"></div>
  <aside class="xxd-panel yaml-panel" data-open role="dialog" aria-modal="true" aria-labelledby="yaml-title">
    <div class="xxd-panel__head">
      <h2 id="yaml-title" class="xxd-panel__title">config.yaml</h2>
      <button type="button" class="xxd-btn" data-size="sm" @click="copy"><Icon name="Copy" :size="16" /><span>{{ t('yaml.copy') }}</span></button>
      <button type="button" class="xxd-btn" data-variant="primary" data-size="sm" :disabled="!store.build.ok" @click="store.downloadConfig()"><Icon name="Download" :size="16" /><span>{{ t('yaml.download') }}</span></button>
      <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only :aria-label="t('common.close')" @click="emit('close')"><Icon name="X" :size="16" /></button>
    </div>
    <div class="xxd-tabs" role="tablist" :aria-label="t('yaml.label')">
      <button v-for="tab in (['all', 'base', 'proxy-groups', 'rules', 'rule-providers'] as const)" :key="tab" type="button" role="tab" :aria-selected="section === tab" @click="section = tab">
        {{ tab === 'all' ? t('yaml.all') : tab === 'base' ? t('yaml.base') : tab }}
      </button>
    </div>
    <pre class="xxd-code yaml" dir="ltr" tabindex="0">{{ shown }}</pre>
  </aside>
</template>

<style scoped>
.yaml-panel { --panel-w: 760px; }
.tabs { flex: none; padding-inline: var(--space-5); }
.yaml { flex: 1; min-height: 0; overflow: auto; border-radius: 0; white-space: pre; tab-size: 2; text-align: left; }
</style>
