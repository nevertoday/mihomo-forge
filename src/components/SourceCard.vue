<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { computed, nextTick, ref } from 'vue'
import { OTHER_REGION_ID } from '@/catalog/regions'
import { askConfirm } from '@/app/confirm'
import { regionName, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { Source } from '@/types'

const props = withDefaults(defineProps<{ source: Source; index: number; total: number; actions?: boolean }>(), { actions: true })
const emit = defineEmits<{ view: [source: Source] }>()
const store = useProjectStore()

const editing = ref(false)
const draft = ref('')
const error = ref('')
const nameInput = ref<HTMLInputElement>()
const fileInput = ref<HTMLInputElement>()

/** Node counts after dedupe, from the current build. */
const built = computed(() => store.build.nodes.filter((n) => n.sourceId === props.source.id))
const duplicates = computed(() => props.source.nodes.length - built.value.length)
const regionChips = computed(() => {
  const counts = new Map<string, number>()
  for (const n of built.value) counts.set(n.regionId ?? OTHER_REGION_ID, (counts.get(n.regionId ?? OTHER_REGION_ID) ?? 0) + 1)
  return store.settings.regions
    .filter((r) => counts.has(r.id))
    .map((r) => ({ id: r.id, icon: r.icon, label: regionName(r), count: counts.get(r.id)! }))
    .sort((a, b) => (a.id === OTHER_REGION_ID ? 1 : b.id === OTHER_REGION_ID ? -1 : b.count - a.count))
})
const waiting = computed(() => props.source.nodes.length === 0 && !props.source.importedAt)

async function startRename() {
  draft.value = props.source.name
  error.value = ''
  editing.value = true
  await nextTick()
  nameInput.value?.select()
}

function commitRename() {
  if (!editing.value) return
  const msg = store.renameSourceById(props.source.id, draft.value)
  if (msg) {
    error.value = msg
    return
  }
  editing.value = false
}

async function replace(list: FileList | null) {
  const file = list?.[0]
  if (!file) return
  // Rename the file so it is matched to this source regardless of its actual name.
  const renamed = new File([file], `${props.source.name}.yaml`, { type: file.type })
  await store.importFiles([renamed])
  if (fileInput.value) fileInput.value.value = ''
}

async function remove() {
  if (await askConfirm(t('sourceCard.confirmRemove', { name: props.source.name }), t('confirm.delete'))) store.removeSource(props.source.id)
}
</script>

<template>
  <li class="source" :class="{ 'is-waiting': waiting }">
    <div class="main">
      <div class="title">
        <template v-if="!editing">
          <h3 dir="auto">{{ source.name }}</h3>
          <button type="button" class="xxd-btn rename-btn" data-variant="ghost" data-icon-only data-size="xs" :aria-label="t('sourceCard.rename')" @click="startRename"><Icon name="Pencil" :size="14" /></button>
        </template>
        <form v-else class="rename" @submit.prevent="commitRename">
          <input ref="nameInput" v-model="draft" class="xxd-input" data-size="sm" maxlength="32" dir="auto" :aria-label="t('sourceCard.nameLabel')" @keydown.esc="editing = false" @blur="commitRename" />
        </form>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="waiting" class="meta wait">{{ t('sourceCard.waiting', { file: source.originalFileName }) }}</p>
      <p v-else class="meta">
        <span class="mono" dir="auto">{{ source.originalFileName }}</span>
        <span>{{ t('sourceCard.valid') }} <b class="num">{{ built.length }}</b></span>
        <span v-if="duplicates">{{ t('sourceCard.duplicates') }} <b class="num">{{ duplicates }}</b></span>
        <span v-if="source.rejected.length">{{ t('sourceCard.rejected') }} <b class="num">{{ source.rejected.length }}</b></span>
        <span v-if="regionChips.length" class="regions">{{ regionChips.map((r) => `${r.label} ${r.count}`).join(' · ') }}</span>
      </p>
    </div>
    <div class="acts">
      <button type="button" class="xxd-btn" data-size="sm" :disabled="waiting" @click="emit('view', source)"><Icon name="Eye" :size="16" /><span>{{ t('sourceCard.view') }}</span></button>
      <button type="button" class="xxd-btn" data-size="sm" @click="fileInput?.click()"><Icon name="FileUp" :size="16" /><span>{{ t('sourceCard.replace') }}</span></button>
      <template v-if="total > 1">
        <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :disabled="index === 0" :aria-label="t('sourceCard.moveUp')" @click="store.moveSource(source.id, -1)"><Icon name="ArrowUp" :size="16" /></button>
        <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :disabled="index === total - 1" :aria-label="t('sourceCard.moveDown')" @click="store.moveSource(source.id, 1)"><Icon name="ArrowDown" :size="16" /></button>
      </template>
      <button type="button" class="xxd-btn danger" data-variant="ghost" data-icon-only data-size="sm" :aria-label="t('sourceCard.remove')" @click="remove"><Icon name="Trash" :size="16" /></button>
      <input ref="fileInput" type="file" accept=".yaml,.yml,.txt" hidden @change="replace(($event.target as HTMLInputElement).files)" />
    </div>
  </li>
</template>

<style scoped>
/* One row per file: who it is and what it brought on the left, what you can do on the right. */
.source { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2) var(--space-4); padding: var(--space-3) 0; }
.main { flex: 1 1 260px; display: grid; gap: var(--space-0-5); min-width: 0; }
.title { display: flex; align-items: center; gap: var(--space-1); min-width: 0; }
h3 { margin: 0; overflow: hidden; font: var(--weight-medium) var(--text-base) / var(--leading-sm) var(--font-body); text-overflow: ellipsis; white-space: nowrap; }
.rename-btn { color: var(--muted); }
.rename { flex: 1; max-width: 280px; }
.meta { display: flex; flex-wrap: wrap; gap: 0 var(--space-3); margin: 0; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }
.meta b { color: var(--ink); font-weight: var(--weight-medium); }
.meta.wait { color: var(--warning); }
.error { margin: 0; color: var(--danger); font-size: var(--text-xs); }
.acts { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1); }
/* Button labels never shrink: the row wraps instead. */
.acts .xxd-btn { flex: none; }
.danger:hover:not(:disabled) { color: var(--danger); }
</style>
