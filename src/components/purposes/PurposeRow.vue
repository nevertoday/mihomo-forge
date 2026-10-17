<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { computed } from 'vue'
import { FOREIGN_PURPOSE_ID } from '@/catalog/purposes'
import { SERVICE_BY_ID } from '@/catalog/services'
import { serviceName, t } from '@/i18n'
import { useLines } from '@/app/lines'
import type { Purpose, PurposeMode } from '@/types'
import { plain } from '@/utils/plain'

const props = defineProps<{ purpose: Purpose }>()
const emit = defineEmits<{ edit: [] }>()
const { label, detail, exists, groups } = useLines()

const catchAll = computed(() => props.purpose.id === FOREIGN_PURPOSE_ID)

/** “Includes ChatGPT, Claude, Gemini and 4 more · 2 custom sites”. */
const covers = computed(() => {
  if (catchAll.value) return t('purpose.catchAll')
  const names = props.purpose.services.filter((id) => SERVICE_BY_ID[id]).map((id) => serviceName(SERVICE_BY_ID[id]))
  const parts: string[] = []
  if (names.length)
    parts.push(names.length > 4 ? t('purpose.coversMore', { list: names.slice(0, 3).join(t('common.listSep')), n: names.length - 3 }) : names.join(t('common.listSep')))
  if (props.purpose.domains.length) parts.push(t('purpose.sites', { n: props.purpose.domains.length }))
  return parts.join(' · ') || t('purpose.nothing')
})

/** A built-in purpose named after its only service (ChatGPT, Google, Netflix…) needs no second line. */
const showCovers = computed(
  () => !(props.purpose.services.length === 1 && !props.purpose.domains.length && props.purpose.id === props.purpose.services[0]),
)

const MODES = computed<{ id: PurposeMode; label: string }[]>(() => [
  { id: 'fallback', label: t('purpose.modeFallback') },
  { id: 'url-test', label: t('purpose.modeFastest') },
  { id: 'select', label: t('purpose.modeSelect') },
])

const available = computed(() =>
  groups.value
    .map((g) => ({ ...g, options: g.options.filter((o) => !props.purpose.lines.includes(o.ref)) }))
    .filter((g) => g.options.length),
)

function add(e: Event) {
  const select = e.target as HTMLSelectElement
  if (select.value) props.purpose.lines.push(select.value)
  select.value = ''
}
function remove(i: number) {
  props.purpose.lines.splice(i, 1)
}
function earlier(i: number) {
  const lines = props.purpose.lines
  ;[lines[i - 1], lines[i]] = [lines[i], lines[i - 1]]
}
</script>

<template>
  <li class="purpose">
    <div class="head">
      <div class="title">
        <h3>{{ plain(purpose.name) }}</h3>
        <p v-if="showCovers" class="covers">{{ covers }}</p>
      </div>
      <label class="xxd-select mode" data-size="sm" data-variant="bare">
        <span class="xxd-sr-only">{{ t('purpose.modeLabel', { name: plain(purpose.name) }) }}</span>
        <select v-model="purpose.mode">
          <option v-for="m in MODES" :key="m.id" :value="m.id">{{ m.label }}</option>
        </select>
      </label>
      <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :aria-label="t('purpose.edit', { name: plain(purpose.name) })" @click="emit('edit')">
        <Icon name="Pencil" :size="16" />
      </button>
    </div>

    <ol class="lines" :aria-label="t('purpose.linesLabel', { name: plain(purpose.name) })">
      <li v-for="(ref, i) in purpose.lines" :key="ref" class="line" :class="{ missing: !exists(ref) }" :title="detail(ref)">
        <span class="n">{{ i + 1 }}</span>
        <span class="name" dir="auto">{{ label(ref) }}</span>
        <button v-if="i > 0" type="button" class="act" :aria-label="t('purpose.earlier', { name: label(ref) })" @click="earlier(i)">
          <Icon name="ArrowLeft" :size="14" class="dir-icon" />
        </button>
        <button type="button" class="act" :aria-label="t('purpose.removeLine', { name: label(ref) })" @click="remove(i)">
          <Icon name="X" :size="14" />
        </button>
      </li>
      <li class="add">
        <label class="xxd-select" data-size="sm">
          <span class="xxd-sr-only">{{ t('purpose.addLine') }}</span>
          <select :aria-label="t('purpose.addLine')" @change="add">
            <option value="">{{ purpose.lines.length ? t('purpose.addMore') : t('purpose.addLine') }}</option>
            <optgroup v-for="g in available" :key="g.label" :label="g.label">
              <option v-for="o in g.options" :key="o.ref" :value="o.ref">{{ o.label }}</option>
            </optgroup>
          </select>
        </label>
      </li>
    </ol>
    <p v-if="purpose.lines.some((r) => !exists(r))" class="note">{{ t('purpose.missingNote') }}</p>
  </li>
</template>

<style scoped>
.purpose { display: grid; gap: var(--space-2); padding: var(--space-4) 0; }
.head { display: flex; align-items: flex-start; gap: var(--space-2); }
.title { flex: 1; min-width: 0; }
h3 { margin: 0; font: var(--weight-medium) var(--text-base) / var(--leading-sm) var(--font-body); }
.covers { margin: 0; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }
.mode { flex: none; }

/* The lines, in order: numbered chips you can move earlier or remove. */
.lines { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-2); margin: 0; padding: 0; list-style: none; }
.line {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1-5);
  height: var(--control-h-sm);
  padding-inline: var(--space-2) var(--space-1);
  border: 1px solid var(--line-strong);
  border-radius: var(--r-sm);
  background: var(--paper);
  font-size: var(--text-sm);
}
.line.missing { border-style: dashed; color: var(--muted); }
.n { display: grid; place-items: center; min-width: 16px; height: 16px; padding-inline: var(--space-1); border-radius: var(--r-xs); background: var(--wash-strong); color: var(--muted); font: var(--weight-medium) var(--text-2xs) / 1 var(--font-body); font-variant-numeric: tabular-nums; }
.name { max-width: 22ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.act { display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0; border-radius: var(--r-xs); background: transparent; color: var(--muted); cursor: pointer; }
.act:hover { background: var(--wash); color: var(--ink); }
.add .xxd-select { width: auto; }
.note { margin: 0; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }

@media (max-width: 640px) {
  .head { flex-wrap: wrap; }
  .title { flex-basis: 100%; }
  .mode select { padding-inline-start: 0; text-align: start; text-align-last: start; }
  .head > .xxd-btn { margin-inline-start: auto; }
}
</style>
