<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { computed } from 'vue'
import { LOCALES, locale, setLocale, t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import type { Locale } from '@/types'
import { go } from './nav'
import { themePref, toggleTheme } from './theme'

const store = useProjectStore()
const dark = computed(() => (themePref.value, document.documentElement.dataset.theme === 'dark'))
/** Size the name field to its content; CJK characters count double. */
/** One primary action: download when the config is valid, otherwise show the problems. */
function download() {
  if (!store.sources.length) return go('sources')
  if (store.build.ok) return store.downloadConfig()
  store.notify(t('topbar.fixFirst'), 'warning')
  go('build')
}

const nameSize = computed(() =>
  Math.max(6, [...store.settings.name].reduce((n, c) => n + (c.charCodeAt(0) > 255 ? 2 : 1), 0) + 1),
)
</script>

<template>
  <header class="xxd-topbar topbar">
    <label class="project-name">
      <span class="xxd-sr-only">{{ t('topbar.projectName') }}</span>
      <input v-model="store.settings.name" class="xxd-input" data-size="sm" dir="auto" :size="nameSize" maxlength="40" spellcheck="false" />
    </label>
    <p class="meta">{{ t('count.sourcesShort', { n: store.sources.length }) }} · {{ t('count.nodesShort', { n: store.nodeCount }) }}</p>
    <span v-if="store.saveState === 'saved'" class="saved" role="status" :title="t('projectFile.storage')"><Icon name="CircleCheck" :size="14" />{{ t('topbar.autosaved') }}</span>
    <div class="spacer"></div>
    <label class="xxd-select lang" data-size="sm">
      <Icon name="Languages" :size="16" />
      <span class="xxd-sr-only">{{ t('topbar.language') }}</span>
      <select :value="locale" :title="t('topbar.language')" @change="setLocale(($event.target as HTMLSelectElement).value as Locale)">
        <option v-for="l in LOCALES" :key="l.id" :value="l.id" :lang="l.id">{{ l.name }}</option>
      </select>
    </label>
    <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :aria-label="dark ? t('topbar.toLight') : t('topbar.toDark')" @click="toggleTheme">
      <Icon v-if="dark" name="Sun" :size="16" /><Icon v-else name="Moon" :size="16" />
    </button>
    <button type="button" class="xxd-btn start" data-variant="primary" data-size="sm" @click="download">
      <Icon name="Download" :size="16" /><span>{{ t('topbar.download') }}</span>
      <span v-if="store.sources.length && !store.build.ok" class="xxd-dot alert" data-tone="danger" aria-hidden="true"></span>
    </button>
  </header>
</template>

<style scoped>
.topbar { position: relative; z-index: var(--z-dock); flex: none; padding-inline: var(--gutter); }
.project-name { display: flex; min-width: 0; flex: 0 1 auto; }
/* The project name edits in place: it reads as the title until hovered or focused. */
.project-name .xxd-input {
  max-width: min(28ch, 100%);
  border-color: transparent;
  background: transparent;
  font-size: var(--text-base);
  font-weight: var(--weight-strong);
}
.project-name .xxd-input:hover { border-color: var(--line); }
.project-name .xxd-input:focus { border-color: var(--line-control); background: var(--paper); }
.meta { margin: 0 var(--space-1); color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-xs); white-space: nowrap; }
.saved { display: inline-flex; align-items: center; gap: var(--space-1-5); color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-xs); white-space: nowrap; }
.saved :deep(.ui-icon) { color: var(--success); }
.spacer { flex: 1; }
/* Language: the select keeps its chevron; the globe sits inside its start edge. */
.lang { position: relative; flex: none; width: auto; }
.lang > :deep(.ui-icon) { position: absolute; inset-inline-start: var(--space-2); top: 50%; color: var(--muted); transform: translateY(-50%); pointer-events: none; }
.lang select { padding-inline-start: calc(var(--space-2) + 16px + var(--space-1-5)); }
.start { position: relative; }
.alert { position: absolute; top: calc(-1 * var(--space-1)); inset-inline-end: calc(-1 * var(--space-1)); box-shadow: 0 0 0 2px var(--bg); }

@media (max-width: 640px) {
  .meta, .saved { display: none; }
  .lang select { width: var(--control-h-sm); padding-inline: 0; color: transparent; }
  .lang select option { color: var(--ink); }
  .lang > :deep(.ui-icon) { inset-inline-start: 50%; transform: translate(-50%, -50%); }
  .lang::after { display: none; }
}
</style>
