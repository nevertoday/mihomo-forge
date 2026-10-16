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
  <header class="topbar">
    <div class="brand">
      <label class="project-name">
        <span class="sr-only">{{ t('topbar.projectName') }}</span>
        <input v-model="store.settings.name" dir="auto" :size="nameSize" maxlength="40" spellcheck="false" />
      </label>
    </div>
    <p class="meta">{{ t('count.sourcesShort', { n: store.sources.length }) }} · {{ t('count.nodesShort', { n: store.nodeCount }) }}</p>
    <span v-if="store.saveState === 'saved'" class="saved" role="status" :title="t('projectFile.storage')"><Icon name="CircleCheck" aria-hidden="true" />{{ t('topbar.autosaved') }}</span>
    <div class="spacer"></div>
    <label class="lang header-control">
      <Icon name="Languages" aria-hidden="true" />
      <span class="sr-only">{{ t('topbar.language') }}</span>
      <select :value="locale" :title="t('topbar.language')" @change="setLocale(($event.target as HTMLSelectElement).value as Locale)">
        <option v-for="l in LOCALES" :key="l.id" :value="l.id" :lang="l.id">{{ l.name }}</option>
      </select>
    </label>
    <button type="button" class="header-icon" :aria-label="dark ? t('topbar.toLight') : t('topbar.toDark')" @click="toggleTheme">
      <Icon name="Sun" v-if="dark" /><Icon name="Moon" v-else />
    </button>
    <button type="button" class="btn btn-primary start" :class="{ 'has-errors': store.sources.length && !store.build.ok }" @click="download">
      <Icon name="Download" aria-hidden="true" />{{ t('topbar.download') }}
    </button>
  </header>
</template>

<style scoped>
/* Reference header: 56px minimum, controls centred with equal inset, translucent paper. */
.topbar {
  position: relative;
  z-index: 20;
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--topbar-height);
  padding: calc((var(--topbar-height) - 1px - var(--navigation-control-size)) / 2) var(--gutter);
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 92%, transparent);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.brand { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 0 1 auto; overflow: hidden; }
.project-name { display: flex; min-width: 0; }
.project-name input {
  min-width: 0;
  max-width: min(28ch, 100%);
  padding: 4px 6px;
  border: 1px solid transparent;
  background: transparent;
  font-size: 15px;
  font-weight: 650;
}
.project-name input:hover { border-color: var(--line); }
.project-name input:focus { outline: none; border-color: var(--line-strong); background: var(--panel); }
.meta { margin: 0 4px; color: var(--muted); font-size: 13px; white-space: nowrap; }
.saved { display: inline-flex; align-items: center; gap: 5px; color: var(--muted); font-size: 12px; white-space: nowrap; }
.saved svg { width: 14px; height: 14px; color: var(--notice-success-ink); }
.has-errors { position: relative; }
.has-errors::after { content: ""; position: absolute; top: -4px; inset-inline-end: -4px; width: 9px; height: 9px; border-radius: 50%; background: var(--notice-error-ink); box-shadow: 0 0 0 2px var(--bg); }
.lang { position: relative; display: inline-flex; align-items: center; color: var(--muted); }
.lang:hover, .lang:focus-within { color: var(--ink); }
.lang svg { position: absolute; inset-inline-start: 11px; pointer-events: none; }
.lang select {
  appearance: none;
  height: var(--navigation-control-size);
  padding-block: 0;
  padding-inline: 36px 12px;
  border: 1px solid var(--line);
  background: var(--paper);
  color: inherit;
  font-size: var(--navigation-font-size);
  font-weight: var(--navigation-font-weight);
  cursor: pointer;
}
.lang select:hover { border-color: var(--line-strong); }
/* Same footprint as the reference “开始使用” header button. */
.start { min-height: 44px; padding: 0 20px; font-size: var(--navigation-font-size); font-weight: var(--navigation-font-weight); }

@media (max-width: 700px) {
  .meta, .saved { display: none; }
  .topbar { gap: 6px; }
  .lang select { width: var(--navigation-control-size); padding-inline: 0; color: transparent; }
  .lang svg { left: 50%; right: auto; transform: translateX(-50%); }
  .lang select option { color: var(--ink); }
  .start { padding: 0 14px; }
}
</style>
