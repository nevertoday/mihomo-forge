<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import LogoMark from '@/components/LogoMark.vue'
import { computed } from 'vue'
import { LOCALES, locale, setLocale, t } from '@/i18n'
import type { Locale } from '@/types'
import { REPO_URL } from './meta'
import { currentView, go } from './nav'
import { themePref, toggleTheme } from './theme'

const dark = computed(() => (themePref.value, document.documentElement.dataset.theme === 'dark'))
</script>

<template>
  <header class="xxd-topbar topbar">
    <a class="xxd-logo brand" href="./" @click.prevent="go('home')"><LogoMark /><span>Mihomo Forge</span></a>
    <div class="spacer"></div>
    <button v-if="currentView === 'home'" type="button" class="xxd-btn" data-variant="ghost" data-size="sm" @click="go('advanced')">
      <Icon name="Settings" :size="16" /><span>{{ t('home.advanced') }}</span>
    </button>
    <button v-else type="button" class="xxd-btn" data-variant="ghost" data-size="sm" @click="go('home')">
      <Icon name="ArrowLeft" :size="16" class="dir-icon" /><span>{{ t('home.back') }}</span>
    </button>
    <label class="xxd-select lang" data-size="sm" data-variant="bare">
      <Icon name="Languages" :size="16" />
      <span class="xxd-sr-only">{{ t('topbar.language') }}</span>
      <select :value="locale" :title="t('topbar.language')" @change="setLocale(($event.target as HTMLSelectElement).value as Locale)">
        <option v-for="l in LOCALES" :key="l.id" :value="l.id" :lang="l.id">{{ l.name }}</option>
      </select>
    </label>
    <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :aria-label="dark ? t('topbar.toLight') : t('topbar.toDark')" @click="toggleTheme">
      <Icon v-if="dark" name="Sun" :size="16" /><Icon v-else name="Moon" :size="16" />
    </button>
    <a class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :href="REPO_URL" target="_blank" rel="noopener" :aria-label="t('nav.repo')">
      <Icon name="Github" :size="16" /><!-- xxd-ignore: brand mark keeps its own drawing (design principles §7) -->
    </a>
  </header>
</template>

<style scoped>
.topbar { position: relative; z-index: var(--z-dock); flex: none; gap: var(--space-1); padding-inline: var(--gutter); }
.brand :deep(.logo-mark) { width: 22px; height: 22px; }
.spacer { flex: 1; }
/* Language: the select keeps its chevron; the globe sits inside its start edge. */
.lang { position: relative; flex: none; width: auto; }
.lang > :deep(.ui-icon) { position: absolute; inset-inline-start: var(--space-2); top: 50%; color: var(--muted); transform: translateY(-50%); pointer-events: none; }
.lang select { padding-inline-start: calc(var(--space-2) + 16px + var(--space-1-5)); }

@media (max-width: 640px) {
  .brand span { display: none; }
  .lang select { width: var(--control-h-sm); padding-inline: 0; color: transparent; }
  .lang select option { color: var(--ink); }
  .lang > :deep(.ui-icon) { inset-inline-start: 50%; transform: translate(-50%, -50%); }
  .lang::after { display: none; }
}
</style>
