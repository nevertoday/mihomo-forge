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
  <article class="card source-card" :class="{ 'is-waiting': waiting }">
    <header class="sc-head">
      <div class="sc-title">
        <template v-if="!editing">
          <h3 dir="auto">{{ source.name }}</h3>
          <button v-if="actions" type="button" class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :aria-label="t('sourceCard.rename')" @click="startRename"><Icon name="Pencil" :size="16" /></button>
        </template>
        <form v-else class="rename" @submit.prevent="commitRename">
          <input ref="nameInput" v-model="draft" class="xxd-input" maxlength="32" dir="auto" :aria-label="t('sourceCard.nameLabel')" @keydown.esc="editing = false" @blur="commitRename" />
        </form>
      </div>
      <div v-if="actions && total > 1" class="row order">
        <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :disabled="index === 0" :aria-label="t('sourceCard.moveUp')" @click="store.moveSource(source.id, -1)"><Icon name="ArrowUp" :size="16" /></button>
        <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :disabled="index === total - 1" :aria-label="t('sourceCard.moveDown')" @click="store.moveSource(source.id, 1)"><Icon name="ArrowDown" :size="16" /></button>
      </div>
    </header>
    <p v-if="error" class="sc-error">{{ error }}</p>
    <p class="sc-file mono" dir="auto">{{ source.originalFileName }}</p>

    <p v-if="waiting" class="xxd-banner sc-wait" data-tone="warning" data-size="sm">{{ t('sourceCard.waiting', { file: source.originalFileName }) }}</p>
    <template v-else>
      <dl class="sc-counts">
        <div><dt>{{ t('sourceCard.valid') }}</dt><dd class="num">{{ built.length }}</dd></div>
        <div><dt>{{ t('sourceCard.duplicates') }}</dt><dd class="num" :class="{ muted: !duplicates }">{{ duplicates }}</dd></div>
        <div><dt>{{ t('sourceCard.rejected') }}</dt><dd class="num" :class="{ muted: !source.rejected.length }">{{ source.rejected.length }}</dd></div>
      </dl>
      <div class="sc-regions">
        <span v-for="r in regionChips" :key="r.id" class="xxd-badge" :title="r.label"><span>{{ r.icon }}</span><span class="num">{{ r.count }}</span></span>
      </div>
    </template>

    <footer v-if="actions" class="sc-actions">
      <button type="button" class="xxd-btn" data-size="sm" :disabled="waiting" @click="emit('view', source)"><Icon name="Eye" :size="16" /><span>{{ t('sourceCard.view') }}</span></button>
      <button type="button" class="xxd-btn" data-size="sm" @click="fileInput?.click()"><Icon name="FileUp" :size="16" /><span>{{ t('sourceCard.replace') }}</span></button>
      <span class="spacer"></span>
      <button type="button" class="xxd-btn danger" data-variant="ghost" data-icon-only data-size="sm" :aria-label="t('sourceCard.remove')" @click="remove"><Icon name="Trash" :size="16" /></button>
      <input ref="fileInput" type="file" accept=".yaml,.yml,.txt" hidden @change="replace(($event.target as HTMLInputElement).files)" />
    </footer>
  </article>
</template>

<style scoped>
.source-card { display: flex; flex-direction: column; gap: var(--space-3); }
.source-card.is-waiting { border-style: dashed; }
.sc-head { display: flex; align-items: center; gap: var(--space-2); }
.sc-title { display: flex; align-items: center; gap: var(--space-1); flex: 1; min-width: 0; }
.sc-title h3 { margin: 0; overflow: hidden; font: var(--weight-strong) var(--text-lg) / var(--leading-md) var(--font-title); text-overflow: ellipsis; white-space: nowrap; }
.rename { flex: 1; }
.rename .xxd-input { height: var(--control-h-sm); font-weight: var(--weight-medium); }
.sc-error { margin: 0; color: var(--danger); font-size: var(--text-xs); line-height: var(--leading-sm); }
/* The file name belongs to the title: closer to it than to the counts. */
.sc-file { margin: calc(-1 * var(--space-2)) 0 0; overflow: hidden; color: var(--muted); text-overflow: ellipsis; white-space: nowrap; }
.sc-wait { margin: 0; }
/* Counts: three columns separated by space, not a box inside the card. */
.sc-counts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-3); margin: 0; }
.sc-counts div { display: flex; flex-direction: column; justify-content: space-between; gap: var(--space-0-5); }
.sc-counts dt { color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-xs); }
.sc-counts dd { margin: 0; font: var(--weight-strong) var(--text-xl) / var(--leading-lg) var(--font-body); }
.sc-regions { display: flex; flex-wrap: wrap; gap: var(--space-1); min-height: 20px; }
.sc-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-1-5); margin-top: auto; }
/* Button labels never shrink: the row wraps instead. */
.sc-actions .xxd-btn { flex: none; }
.danger:hover:not(:disabled) { color: var(--danger); }
.order { gap: 0; }
</style>
