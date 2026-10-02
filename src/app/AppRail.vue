<script setup lang="ts">
import { Github } from 'lucide-vue-next'
import LogoMark from '@/components/LogoMark.vue'
import { t } from '@/i18n'
import { REPO_URL } from './meta'
import { currentView, go, NAV_ITEMS } from './nav'
</script>

<template>
  <nav class="rail" :aria-label="t('nav.label')">
    <a class="rail-mark" href="#/overview" :aria-label="t('nav.home')" @click.prevent="go('overview')">
      <LogoMark />
    </a>
    <div class="rail-nav">
      <button
        v-for="item in NAV_ITEMS"
        :key="item.id"
        type="button"
        class="rail-item"
        :aria-current="currentView === item.id ? 'page' : undefined"
        :data-label="t(`nav.${item.id}`)"
        @click="go(item.id)"
      >
        <component :is="item.icon" aria-hidden="true" />
        <span class="rail-text">{{ t(`nav.${item.id}`) }}</span>
      </button>
    </div>
    <a class="rail-item rail-foot" :href="REPO_URL" target="_blank" rel="noopener" :data-label="t('nav.repo')">
      <Github aria-hidden="true" />
      <span class="sr-only">{{ t('nav.repo') }}</span>
    </a>
  </nav>
</template>

<style scoped>
.rail {
  position: fixed;
  z-index: 40;
  inset-block: 0;
  inset-inline-start: 0;
  width: var(--rail-width);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
  border-inline-end: 1px solid var(--line);
  background: var(--rail-bg);
}
.rail-mark { display: grid; place-items: center; width: 40px; height: 40px; margin-bottom: 10px; }
.rail-nav { display: grid; gap: 4px; }
.rail-item {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--muted);
}
.rail-item svg { width: 20px; height: 20px; stroke-width: 1.8; }
.rail-item:hover, .rail-item[aria-current="page"] { color: var(--ink); }
.rail-item[aria-current="page"]::after {
  content: "";
  position: absolute;
  top: 50%;
  inset-inline-end: -9px;
  width: 2px;
  height: 26px;
  background: var(--ink);
  transform: translateY(-50%);
}
.rail-text { display: none; }
.rail-item::before {
  content: attr(data-label);
  position: absolute;
  inset-inline-start: calc(100% + 12px);
  top: 50%;
  padding: 4px 10px;
  transform: translateY(-50%);
  background: var(--ink);
  color: var(--paper);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 120ms ease;
}
.rail-item:hover::before, .rail-item:focus-visible::before { opacity: 1; }
.rail-foot { margin-top: auto; }

@media (max-width: 760px) {
  .rail {
    inset: auto 0 0 0;
    width: 100%;
    height: calc(60px + env(safe-area-inset-bottom));
    flex-direction: row;
    justify-content: space-around;
    padding: 0 4px env(safe-area-inset-bottom);
    border-inline-end: 0;
    border-top: 1px solid var(--line);
  }
  .rail-mark, .rail-foot { display: none; }
  .rail-nav { display: flex; width: 100%; justify-content: space-around; gap: 0; }
  .rail-item { width: auto; height: 56px; flex: 1; gap: 2px; align-content: center; }
  .rail-item svg { width: 19px; height: 19px; }
  .rail-text { display: block; font-size: 10.5px; font-weight: 700; line-height: 1; }
  .rail-item::before { display: none; }
  .rail-item[aria-current="page"]::after { top: 0; inset-inline: 30%; width: auto; height: 2px; transform: none; }
}
</style>
