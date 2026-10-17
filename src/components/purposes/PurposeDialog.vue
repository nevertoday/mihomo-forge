<script setup lang="ts">
import { computed, ref } from 'vue'
import { EXTRA_PURPOSE_TEMPLATES, FOREIGN_PURPOSE_ID, purposeFromTemplate } from '@/catalog/purposes'
import { MODULES, SERVICE_BY_ID, servicesOfModule } from '@/catalog/services'
import { askConfirm } from '@/app/confirm'
import KitDialog from '@/components/KitDialog.vue'
import { serviceName, t, tDynamic } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { Purpose } from '@/types'
import { uid } from '@/utils/hash'
import { plain } from '@/utils/plain'

/** `purpose` set: edit it. Not set: create a new one (from a common purpose or from scratch). */
const props = defineProps<{ purpose?: Purpose }>()
const emit = defineEmits<{ close: [] }>()
const store = useProjectStore()
const purposes = computed(() => store.settings.purposes)

const editing = computed(() => !!props.purpose)
const catchAll = computed(() => props.purpose?.id === FOREIGN_PURPOSE_ID)
const draft = ref({
  id: props.purpose?.id ?? '',
  name: props.purpose?.name ?? '',
  services: [...(props.purpose?.services ?? [])],
  sitesText: (props.purpose?.domains ?? []).join('\n'),
})
const error = ref('')

/** Common purposes not added yet, offered as a starting point. */
const templates = computed(() => EXTRA_PURPOSE_TEMPLATES.filter((tp) => !purposes.value.some((p) => p.id === tp.id)))
function startFrom(id: string) {
  const tp = EXTRA_PURPOSE_TEMPLATES.find((x) => x.id === id)!
  const p = purposeFromTemplate(tp, store.settings.outputLocale)
  draft.value = { id: p.id, name: p.name, services: p.services, sitesText: '' }
}

/** Known sites by kind; LAN, mainland China and the catch-all are not offered. */
const BASE_SERVICES = ['google', 'microsoft', 'apple']
const serviceGroups = computed(() => [
  { id: 'base', label: t('purpose.commonSites'), services: BASE_SERVICES.map((id) => SERVICE_BY_ID[id]) },
  ...MODULES.map((m) => ({ id: m.id, label: tDynamic(`moduleNames.${m.id}`), services: servicesOfModule(m.id) })),
])
/** Which other purpose already routes a service (ticking it here moves it). */
function owner(serviceId: string): Purpose | undefined {
  return purposes.value.find((p) => p !== props.purpose && p.services.includes(serviceId))
}

const sites = () => draft.value.sitesText.split(/[\s,，]+/).map((x) => x.trim()).filter(Boolean)

function save() {
  const name = draft.value.name.trim()
  if (!name) return (error.value = t('purpose.nameRequired'))
  if (!catchAll.value && !draft.value.services.length && !sites().length) return (error.value = t('purpose.needSites'))
  if (purposes.value.some((p) => p !== props.purpose && p.name.trim() === name)) return (error.value = t('purpose.nameTaken'))
  // A service routes through one purpose only.
  for (const p of purposes.value) if (p !== props.purpose) p.services = p.services.filter((id) => !draft.value.services.includes(id))
  if (props.purpose) {
    props.purpose.name = name
    props.purpose.services = [...draft.value.services]
    props.purpose.domains = sites()
  } else {
    const template = EXTRA_PURPOSE_TEMPLATES.find((x) => x.id === draft.value.id)
    const created: Purpose = {
      id: template && !purposes.value.some((p) => p.id === template.id) ? template.id : uid(),
      name,
      services: [...draft.value.services],
      domains: sites(),
      lines: template ? purposeFromTemplate(template, store.settings.outputLocale).lines : ['all'],
      mode: template ? purposeFromTemplate(template, store.settings.outputLocale).mode : 'fallback',
    }
    // New purposes go before the catch-all so their rules win.
    const at = purposes.value.findIndex((p) => p.id === FOREIGN_PURPOSE_ID)
    purposes.value.splice(at < 0 ? purposes.value.length : at, 0, created)
  }
  emit('close')
}

async function remove() {
  const p = props.purpose
  if (!p || catchAll.value) return
  const foreign = purposes.value.find((x) => x.id === FOREIGN_PURPOSE_ID)
  const ok = await askConfirm(t('purpose.removeConfirm', { name: plain(p.name), fallback: plain(foreign?.name) }), t('purpose.remove'))
  if (!ok) return
  purposes.value.splice(purposes.value.indexOf(p), 1)
  emit('close')
}
</script>

<template>
  <KitDialog size="lg" labelledby="purpose-title" @close="emit('close')">
    <div class="xxd-dialog__head">
      <h2 id="purpose-title" class="xxd-dialog__title">{{ editing ? t('purpose.dialogEdit') : t('purpose.dialogNew') }}</h2>
    </div>
    <form id="purpose-form" class="xxd-dialog__body body" @submit.prevent="save">
      <div v-if="!editing && templates.length" class="xxd-field">
        <span class="xxd-label">{{ t('purpose.startFrom') }}</span>
        <div class="xxd-cluster">
          <button v-for="tp in templates" :key="tp.id" type="button" class="xxd-chip" :aria-pressed="draft.id === tp.id" @click="startFrom(tp.id)">
            {{ plain(purposeFromTemplate(tp, store.settings.outputLocale).name) }}
          </button>
        </div>
      </div>

      <label class="xxd-field">
        <span class="xxd-label">{{ t('purpose.name') }}</span>
        <input v-model="draft.name" class="xxd-input" dir="auto" maxlength="40" :placeholder="t('purpose.namePlaceholder')" />
        <small class="xxd-help">{{ t('purpose.nameHint') }}</small>
      </label>

      <template v-if="!catchAll">
        <label class="xxd-field">
          <span class="xxd-label">{{ t('purpose.sitesLabel') }}</span>
          <textarea v-model="draft.sitesText" class="xxd-textarea sites" dir="ltr" spellcheck="false" placeholder="chatgpt.com&#10;oaiusercontent.com"></textarea>
          <small class="xxd-help">{{ t('purpose.sitesHint') }}</small>
        </label>

        <details class="xxd-collapse" :open="draft.services.length > 0">
          <summary>{{ t('purpose.servicesLabel') }}</summary>
          <fieldset class="known">
          <legend class="xxd-sr-only">{{ t('purpose.servicesLabel') }}</legend>
          <div v-for="g in serviceGroups" :key="g.id" class="known-group">
            <p class="known-title">{{ g.label }}</p>
            <div class="known-grid">
              <label v-for="s in g.services" :key="s.id" class="xxd-choice">
                <input v-model="draft.services" class="xxd-check" type="checkbox" :value="s.id" />
                <span class="check-label">
                  <span>{{ serviceName(s) }}</span>
                  <small v-if="owner(s.id)">{{ t('purpose.takenBy', { name: plain(owner(s.id)!.name) }) }}</small>
                </span>
              </label>
            </div>
          </div>
          </fieldset>
        </details>
      </template>
      <p v-else class="catch-all">{{ t('purpose.catchAllEdit') }}</p>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>
    <div class="xxd-dialog__actions">
      <button v-if="editing && !catchAll" type="button" class="xxd-btn delete" data-variant="danger-outline" @click="remove">{{ t('purpose.remove') }}</button>
      <button type="button" class="xxd-btn ui-dialog-cancel" @click="emit('close')">{{ t('common.cancel') }}</button>
      <button type="submit" form="purpose-form" class="xxd-btn" data-variant="primary">{{ editing ? t('purpose.save') : t('purpose.create') }}</button>
    </div>
  </KitDialog>
</template>

<style scoped>
.body { color: var(--ink); }
.sites { min-height: 88px; font-family: var(--font-mono); font-size: var(--text-xs); }
.known { display: grid; gap: var(--space-3); margin: 0; padding: 0; border: 0; }
.known-title { margin: 0 0 var(--space-1); color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-xs); }
.known-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--space-1) var(--space-3); }
.known-grid small { color: var(--muted); font-size: var(--text-2xs); line-height: var(--leading-xs); }
.catch-all { margin: 0; color: var(--muted); }
.error { margin: 0; color: var(--danger); font-size: var(--text-xs); }
/* Deleting is separate from the dialog's answer: it sits at the start, away from save. */
.delete { margin-inline-end: auto; }
</style>
