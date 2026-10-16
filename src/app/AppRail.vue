<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import LogoMark from '@/components/LogoMark.vue'
import { t } from '@/i18n'
import { REPO_URL } from './meta'
import { currentView, go, NAV_ITEMS } from './nav'
import { railExpanded, toggleRail } from './rail'

/** Like the reference rail: clicking empty rail space toggles it; controls keep their own action. */
function onRailClick(e: MouseEvent) {
  if (matchMedia('(max-width: 700px)').matches) return
  if ((e.target as HTMLElement).closest('a, button')) return
  toggleRail()
}
</script>

<template>
  <aside class="rail" :aria-label="t('nav.label')" @click="onRailClick">
    <a class="rail-logo" href="#/overview" :aria-label="t('nav.home')" @click.prevent="go('overview')">
      <span class="rail-symbol"><LogoMark /></span>
      <strong>Mihomo Forge</strong>
    </a>
    <nav class="rail-nav">
      <button
        v-for="item in NAV_ITEMS"
        :key="item.id"
        type="button"
        class="rail-item"
        :aria-current="currentView === item.id ? 'page' : undefined"
        :aria-label="t(`nav.${item.id}`)"
        :data-tooltip="t(`nav.${item.id}`)"
        :data-view="item.id"
        @click="go(item.id)"
      >
        <span class="rail-symbol"><Icon :name="item.icon" :size="20" /></span>
        <em>{{ t(`nav.${item.id}`) }}</em>
      </button>
    </nav>
    <div class="rail-foot">
      <a class="rail-item" :href="REPO_URL" target="_blank" rel="noopener" :aria-label="t('nav.repo')" :data-tooltip="t('nav.repo')">
        <span class="rail-symbol"><Icon name="Github" :size="20" /></span>
        <em>GitHub</em>
      </a>
      <button
        type="button"
        class="rail-item"
        :aria-expanded="railExpanded"
        :aria-label="railExpanded ? t('nav.collapse') : t('nav.expand')"
        :data-tooltip="railExpanded ? t('nav.collapse') : t('nav.expand')"
        @click="toggleRail"
      >
        <span class="rail-symbol"><Icon name="PanelLeft" :size="20" /></span>
        <em>{{ t('nav.collapse') }}</em>
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* Geometry follows the reference rail: 56px collapsed / 188px expanded, 40px items, 32px marks. */
.rail {
  --item: 40px;
  --mark: 32px;
  position: fixed;
  z-index: 40;
  inset-block: 0;
  inset-inline-start: 0;
  width: var(--rail-width);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  overflow: hidden;
  border-inline-end: 1px solid var(--line);
  background: var(--rail-bg);
  cursor: pointer;
  transition: width 280ms cubic-bezier(0.22, 1, 0.36, 1);
}
.rail-nav { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; }
.rail-foot { display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; margin-top: auto; }
.rail-logo, .rail-item {
  position: relative;
  display: grid;
  grid-template-columns: var(--mark) minmax(0, 1fr);
  column-gap: 10px;
  align-items: center;
  width: calc(100% + 8px);
  min-width: 0;
  min-height: var(--item);
  margin-inline-start: -4px;
  padding: 0 4px;
  border: 0;
  color: var(--muted);
  background: transparent;
  text-align: start;
  text-decoration: none;
  cursor: pointer;
}
.rail-logo { margin-bottom: 8px; color: var(--ink); }
.rail-symbol { display: grid; place-items: center; width: var(--mark); height: var(--mark); }
.rail-logo :deep(.logo-mark) { width: 28px; height: 28px; }
.rail-logo strong { font-family: var(--font-title); font-size: 14px; font-weight: 900; white-space: nowrap; }
.rail-item em {
  min-width: 0;
  overflow: hidden;
  font-style: normal;
  font-size: 12px;
  font-weight: var(--navigation-font-weight);
  line-height: 1.3;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.rail-logo strong, .rail-item em { opacity: 1; transition: opacity 200ms cubic-bezier(0.22, 1, 0.36, 1); }
:root[data-rail="collapsed"] .rail-logo strong,
:root[data-rail="collapsed"] .rail-item em { opacity: 0; }

/* Selection changes color and background, never weight (reference navigation rule). */
.rail-item:hover, .rail-item:focus-visible { color: var(--ink); }
.rail-item[aria-current="page"] { color: var(--ink); background: var(--rail-active-track); }

/* Collapsed: a compact tooltip names each destination. */
.rail-item::after {
  content: attr(data-tooltip);
  position: absolute;
  inset-inline-start: calc(100% + 14px);
  top: 50%;
  z-index: 2;
  padding: 4px 10px;
  transform: translateY(-50%);
  background: var(--ink);
  color: var(--paper);
  font-size: 12px;
  font-weight: var(--navigation-font-weight);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
}
:root[data-rail="collapsed"] .rail { overflow: visible; }
:root[data-rail="collapsed"] .rail-item:hover::after,
:root[data-rail="collapsed"] .rail-item:focus-visible::after { opacity: 1; visibility: visible; }

/*
 * Hover / focus motion in the 小小东 rail vocabulary: strokes draw themselves (pathLength 100),
 * blocks assemble in sequence, parts slide a little. 480–760ms, one shared easing curve.
 */
.rail-symbol :deep(svg), .rail-symbol :deep(svg > *) { transform-box: fill-box; transform-origin: center; }
.rail-item[data-view="overview"]:is(:hover, :focus-visible) :deep(svg > path) { animation: rail-home-draw 720ms var(--ease) both; }
.rail-item[data-view="overview"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(2)) { animation-delay: 80ms; }
.rail-item[data-view="sources"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(1)) { animation: rail-lift 720ms var(--ease) both; }
.rail-item[data-view="sources"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(2)) { --slide: -2.5px; animation: rail-slide-draw 560ms 100ms var(--ease) both; }
.rail-item[data-view="strategies"]:is(:hover, :focus-visible) :deep(svg > rect) { animation: rail-module-assemble 640ms var(--ease) both; }
.rail-item[data-view="strategies"]:is(:hover, :focus-visible) :deep(svg > rect:nth-of-type(2)) { animation-delay: 80ms; }
.rail-item[data-view="strategies"]:is(:hover, :focus-visible) :deep(svg > rect:nth-of-type(3)) { animation-delay: 160ms; }
.rail-item[data-view="strategies"]:is(:hover, :focus-visible) :deep(svg > path) { animation: rail-stroke-draw 480ms 240ms var(--ease) both; }
.rail-item[data-view="rules"]:is(:hover, :focus-visible) :deep(svg > path) { animation: rail-stroke-draw 520ms var(--ease) both; }
.rail-item[data-view="rules"]:is(:hover, :focus-visible) :deep(svg > rect) { animation: rail-module-assemble 640ms 80ms var(--ease) both; }
.rail-item[data-view="rules"]:is(:hover, :focus-visible) :deep(svg > rect:nth-of-type(2)) { animation-delay: 160ms; }
.rail-item[data-view="base"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(1)) { animation: rail-stroke-draw 520ms var(--ease) both; }
.rail-item[data-view="base"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(2)) { --slide: 2px; animation: rail-slide 640ms 80ms var(--ease) both; }
.rail-item[data-view="build"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(1)) { animation: rail-drop 640ms var(--ease) both; }
.rail-item[data-view="build"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(2)) { animation: rail-lift 720ms 220ms var(--ease) both; }
.rail { --ease: cubic-bezier(0.22, 1, 0.36, 1); }

@keyframes rail-home-draw {
  0% { stroke-dasharray: 100; stroke-dashoffset: 100; transform: translateY(1px) scale(0.94); opacity: 0.22; }
  72% { stroke-dasharray: 100; stroke-dashoffset: 0; transform: translateY(-0.15px) scale(1.02); opacity: 1; }
  100% { stroke-dasharray: 100; stroke-dashoffset: 0; transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes rail-stroke-draw {
  0% { stroke-dasharray: 100; stroke-dashoffset: 100; opacity: 0.35; }
  100% { stroke-dasharray: 100; stroke-dashoffset: 0; opacity: 1; }
}
@keyframes rail-module-assemble {
  0% { transform: translateY(1px) scale(0.86); opacity: 0.3; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes rail-slide {
  0% { transform: translateX(var(--slide)); opacity: 0.35; }
  100% { transform: translateX(0); opacity: 1; }
}
@keyframes rail-slide-draw {
  0% { stroke-dasharray: 100; stroke-dashoffset: 100; transform: translateX(var(--slide)); opacity: 0.35; }
  100% { stroke-dasharray: 100; stroke-dashoffset: 0; transform: translateX(0); opacity: 1; }
}
@keyframes rail-lift {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-1px); }
}
@keyframes rail-drop {
  0% { stroke-dasharray: 100; stroke-dashoffset: 100; transform: translateY(-2.5px); opacity: 0.3; }
  72% { stroke-dasharray: 100; stroke-dashoffset: 0; transform: translateY(0.4px); opacity: 1; }
  100% { stroke-dasharray: 100; stroke-dashoffset: 0; transform: translateY(0); opacity: 1; }
}

@media (max-width: 700px) {
  .rail {
    inset: auto 0 0 0;
    width: 100%;
    height: calc(60px + env(safe-area-inset-bottom));
    flex-direction: row;
    padding: 0 0 env(safe-area-inset-bottom);
    border-inline-end: 0;
    border-top: 1px solid var(--line);
    cursor: auto;
  }
  .rail-logo, .rail-foot { display: none; }
  .rail-nav { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0; width: 100%; }
  .rail-item { grid-template-columns: 1fr; justify-items: center; align-content: center; row-gap: 2px; width: 100%; height: 60px; margin: 0; padding: 0; }
  .rail-item em,
  :root[data-rail="collapsed"] .rail-item em { width: 100%; font-size: 10px; text-align: center; opacity: 1; }
  .rail-symbol { width: auto; height: auto; }
  .rail-item::after { display: none; }
}

/* Phones: no hover motion, just a press response (as on the reference). */
@media (max-width: 700px) {
  .rail-item:is(:hover, :focus-visible) :deep(svg > *) { animation: none !important; }
  .rail-item:active .rail-symbol :deep(svg) { transform: translateY(1px) scale(0.9); }
}

@media (prefers-reduced-motion: reduce) {
  .rail, .rail-logo strong, .rail-item em { transition: none; }
  .rail-item :deep(svg), .rail-item :deep(svg > *) { animation: none !important; transform: none !important; opacity: 1; }
}
</style>
