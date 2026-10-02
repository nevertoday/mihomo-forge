<script setup lang="ts">
import { ArrowDown, ArrowUp, Eye, FileUp, Pencil, Trash2 } from 'lucide-vue-next'
import { computed, nextTick, ref } from 'vue'
import { OTHER_REGION_ID } from '@/catalog/regions'
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

function remove() {
  if (confirm(t('sourceCard.confirmRemove', { name: props.source.name }))) store.removeSource(props.source.id)
}
</script>

<template>
  <article class="card source-card" :class="{ 'is-waiting': waiting }">
    <header class="sc-head">
      <div class="sc-title">
        <template v-if="!editing">
          <h3 dir="auto">{{ source.name }}</h3>
          <button v-if="actions" type="button" class="icon-btn sm" :aria-label="t('sourceCard.rename')" @click="startRename"><Pencil /></button>
        </template>
        <form v-else class="rename" @submit.prevent="commitRename">
          <input ref="nameInput" v-model="draft" class="input" maxlength="32" dir="auto" :aria-label="t('sourceCard.nameLabel')" @keydown.esc="editing = false" @blur="commitRename" />
        </form>
      </div>
      <div v-if="actions && total > 1" class="row order">
        <button type="button" class="icon-btn sm" :disabled="index === 0" :aria-label="t('sourceCard.moveUp')" @click="store.moveSource(source.id, -1)"><ArrowUp /></button>
        <button type="button" class="icon-btn sm" :disabled="index === total - 1" :aria-label="t('sourceCard.moveDown')" @click="store.moveSource(source.id, 1)"><ArrowDown /></button>
      </div>
    </header>
    <p v-if="error" class="sc-error">{{ error }}</p>
    <p class="sc-file mono" dir="auto">{{ source.originalFileName }}</p>

    <p v-if="waiting" class="notice notice-warning sc-wait">{{ t('sourceCard.waiting', { file: source.originalFileName }) }}</p>
    <template v-else>
      <dl class="sc-counts">
        <div><dt>{{ t('sourceCard.valid') }}</dt><dd class="num">{{ built.length }}</dd></div>
        <div><dt>{{ t('sourceCard.duplicates') }}</dt><dd class="num" :class="{ muted: !duplicates }">{{ duplicates }}</dd></div>
        <div><dt>{{ t('sourceCard.rejected') }}</dt><dd class="num" :class="{ muted: !source.rejected.length }">{{ source.rejected.length }}</dd></div>
      </dl>
      <div class="sc-regions">
        <span v-for="r in regionChips" :key="r.id" class="chip" :title="r.label"><span>{{ r.icon }}</span><span class="num">{{ r.count }}</span></span>
      </div>
    </template>

    <footer v-if="actions" class="sc-actions">
      <button type="button" class="btn btn-sm" :disabled="waiting" @click="emit('view', source)"><Eye />{{ t('sourceCard.view') }}</button>
      <button type="button" class="btn btn-sm" @click="fileInput?.click()"><FileUp />{{ t('sourceCard.replace') }}</button>
      <span class="spacer"></span>
      <button type="button" class="icon-btn sm danger" :aria-label="t('sourceCard.remove')" @click="remove"><Trash2 /></button>
      <input ref="fileInput" type="file" accept=".yaml,.yml,.txt" hidden @change="replace(($event.target as HTMLInputElement).files)" />
    </footer>
  </article>
</template>

<style scoped>
.source-card { display: flex; flex-direction: column; gap: 10px; }
.source-card.is-waiting { border-style: dashed; }
.sc-head { display: flex; align-items: center; gap: 8px; }
.sc-title { display: flex; align-items: center; gap: 4px; flex: 1; min-width: 0; }
.sc-title h3 { margin: 0; font-family: var(--font-title); font-size: 19px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rename { flex: 1; }
.rename .input { min-height: 34px; padding: 4px 8px; font-weight: 700; }
.sc-error { margin: -4px 0 0; color: var(--notice-error-ink); font-size: 12px; }
.sc-file { margin: -6px 0 0; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sc-wait { margin: 0; }
.sc-counts { display: grid; grid-template-columns: repeat(3, 1fr); margin: 0; border: 1px solid var(--line); }
.sc-counts div { padding: 8px 10px; border-inline-end: 1px solid var(--line); }
.sc-counts div:last-child { border-inline-end: 0; }
.sc-counts dt { color: var(--muted); font-size: 11px; font-weight: 700; }
.sc-counts dd { margin: 0; font-size: 22px; font-weight: 700; line-height: 1.2; }
.sc-regions { display: flex; flex-wrap: wrap; gap: 4px; min-height: 24px; }
.sc-actions { display: flex; align-items: center; gap: 6px; margin-top: auto; padding-top: 4px; }
.icon-btn.sm { width: 30px; height: 30px; }
.icon-btn.sm svg { width: 15px; height: 15px; }
.icon-btn:disabled { opacity: 0.3; }
.icon-btn.danger:hover { color: var(--notice-error-ink); background: var(--notice-error-bg); }
.order { gap: 0; }
</style>
