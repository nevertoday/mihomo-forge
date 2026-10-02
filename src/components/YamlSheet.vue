<script setup lang="ts">
import { Copy, Download, X } from 'lucide-vue-next'
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
  <div class="sheet-overlay" @click="emit('close')"></div>
  <aside class="sheet" role="dialog" aria-modal="true" :aria-label="t('yaml.label')">
    <header class="dialog-head">
      <h2>config.yaml</h2>
      <button type="button" class="btn btn-sm" @click="copy"><Copy />{{ t('yaml.copy') }}</button>
      <button type="button" class="btn btn-sm btn-primary" :disabled="!store.build.ok" @click="store.downloadConfig()"><Download />{{ t('yaml.download') }}</button>
      <button type="button" class="icon-btn" :aria-label="t('common.close')" @click="emit('close')"><X /></button>
    </header>
    <div class="tabs sheet-tabs" role="tablist">
      <button v-for="tab in (['all', 'base', 'proxy-groups', 'rules', 'rule-providers'] as const)" :key="tab" type="button" role="tab" :aria-selected="section === tab" @click="section = tab">
        {{ tab === 'all' ? t('yaml.all') : tab === 'base' ? t('yaml.base') : tab }}
      </button>
    </div>
    <pre class="code yaml" dir="ltr">{{ shown }}</pre>
  </aside>
</template>

<style scoped>
.sheet-tabs { padding: 0 12px; }
.yaml { flex: 1; margin: 0; border: 0; }
</style>
