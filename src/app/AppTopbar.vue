<script setup lang="ts">
import { CircleCheck, Download, Languages, Moon, Sun } from 'lucide-vue-next'
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
      <strong class="brand-name">Mihomo Forge</strong>
      <span class="brand-sep" aria-hidden="true">/</span>
      <label class="project-name">
        <span class="sr-only">{{ t('topbar.projectName') }}</span>
        <input v-model="store.settings.name" dir="auto" :size="nameSize" maxlength="40" spellcheck="false" />
      </label>
    </div>
    <p class="meta">{{ t('count.sourcesShort', { n: store.sources.length }) }} · {{ t('count.nodesShort', { n: store.nodeCount }) }}</p>
    <span v-if="store.saveState === 'saved'" class="saved" role="status" :title="t('projectFile.storage')"><CircleCheck aria-hidden="true" />{{ t('topbar.autosaved') }}</span>
    <div class="spacer"></div>
    <label class="lang">
      <Languages aria-hidden="true" />
      <span class="sr-only">{{ t('topbar.language') }}</span>
      <select :value="locale" :title="t('topbar.language')" @change="setLocale(($event.target as HTMLSelectElement).value as Locale)">
        <option v-for="l in LOCALES" :key="l.id" :value="l.id" :lang="l.id">{{ l.name }}</option>
      </select>
    </label>
    <button type="button" class="icon-btn" :aria-label="dark ? t('topbar.toLight') : t('topbar.toDark')" @click="toggleTheme">
      <Sun v-if="dark" /><Moon v-else />
    </button>
    <button type="button" class="btn btn-primary btn-sm" :class="{ 'has-errors': store.sources.length && !store.build.ok }" @click="download">
      <Download aria-hidden="true" />{{ t('topbar.download') }}
    </button>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--topbar-height);
  padding: 0 var(--gutter);
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg) 90%, transparent);
  backdrop-filter: saturate(115%) blur(16px);
  -webkit-backdrop-filter: saturate(115%) blur(16px);
}
.brand { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 0 1 auto; overflow: hidden; }
.project-name { display: flex; min-width: 0; }
.brand-name { font-family: "Noto Serif SC", var(--font-title); font-size: 18px; font-weight: 900; white-space: nowrap; }
.brand-sep { color: var(--line-strong); }
.project-name input {
  min-width: 0;
  max-width: min(28ch, 100%);
  padding: 4px 6px;
  border: 1px solid transparent;
  background: transparent;
  font-weight: 700;
}
.project-name input:hover { border-color: var(--line); }
.project-name input:focus { outline: none; border-color: var(--line-strong); background: var(--panel); }
.meta { margin: 0; color: var(--muted); font-size: 13px; white-space: nowrap; }
.saved { display: inline-flex; align-items: center; gap: 5px; color: var(--muted); font-size: 12px; white-space: nowrap; }
.saved svg { width: 14px; height: 14px; color: var(--notice-success-ink); }
.has-errors { position: relative; }
.has-errors::after { content: ""; position: absolute; top: -4px; inset-inline-end: -4px; width: 9px; height: 9px; border-radius: 50%; background: var(--notice-error-ink); box-shadow: 0 0 0 2px var(--bg); }
.lang { position: relative; display: inline-flex; align-items: center; color: var(--muted); }
.lang:hover, .lang:focus-within { color: var(--ink); }
.lang svg { position: absolute; inset-inline-start: 8px; width: 16px; height: 16px; pointer-events: none; }
.lang select {
  appearance: none;
  min-height: 30px;
  padding-block: 0;
  padding-inline: 30px 10px;
  border: 1px solid transparent;
  background: transparent;
  color: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
.lang select:hover { border-color: var(--line); }

@media (max-width: 760px) {
  .brand-name, .brand-sep, .meta, .saved { display: none; }
  .topbar { gap: 4px; }
  .lang select { width: 34px; padding-inline: 30px 0; color: transparent; }
  .lang select option { color: var(--ink); }
}
</style>
