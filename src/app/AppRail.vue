<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import LogoMark from '@/components/LogoMark.vue'
import { t } from '@/i18n'
import { REPO_URL } from './meta'
import { currentView, go, NAV_ITEMS } from './nav'
import { railExpanded, toggleRail } from './rail'

/** Like the reference rail: clicking empty rail space toggles it; controls keep their own action. */
function onRailClick(e: MouseEvent) {
  if (matchMedia('(max-width: 640px)').matches) return
  if ((e.target as HTMLElement).closest('a, button')) return
  toggleRail()
}
</script>

<template>
  <!-- 小小东 UI Kit sidebar: expanded with labels, or collapsed to icons (data-collapsed, instant; labels fade). -->
  <aside class="xxd-sidebar rail" :data-collapsed="railExpanded ? undefined : ''" :aria-label="t('nav.label')" @click="onRailClick">
    <div class="xxd-sidebar__head">
      <a class="xxd-logo rail-logo" href="#/overview" :aria-label="t('nav.home')" @click.prevent="go('overview')">
        <LogoMark /><span data-sidebar-hide>Mihomo Forge</span>
      </a>
    </div>
    <nav class="xxd-sidebar__body">
      <button
        v-for="item in NAV_ITEMS"
        :key="item.id"
        type="button"
        class="xxd-sidebar__item"
        :aria-current="currentView === item.id ? 'page' : undefined"
        :data-tooltip="t(`nav.${item.id}`)"
        :data-view="item.id"
        @click="go(item.id)"
      >
        <Icon :name="item.icon" /><span>{{ t(`nav.${item.id}`) }}</span>
      </button>
    </nav>
    <div class="xxd-sidebar__foot">
      <a class="xxd-sidebar__item" :href="REPO_URL" target="_blank" rel="noopener" :data-tooltip="t('nav.repo')">
        <Icon name="Github" /><span>GitHub</span><!-- xxd-ignore: brand mark keeps its own drawing (design principles §7) -->
      </a>
      <button
        type="button"
        class="xxd-btn rail-toggle"
        data-variant="ghost"
        data-icon-only
        data-size="sm"
        :aria-expanded="railExpanded"
        :aria-label="railExpanded ? t('nav.collapse') : t('nav.expand')"
        :data-tooltip="railExpanded ? t('nav.collapse') : t('nav.expand')"
        @click="toggleRail"
      >
        <Icon name="PanelLeft" :size="16" />
      </button>
    </div>
  </aside>
</template>

<style scoped>
.rail {
  --sidebar-w: var(--rail-width);
  position: fixed;
  z-index: var(--z-dock);
  inset-block: 0;
  inset-inline-start: 0;
  height: 100dvh;
}
.xxd-sidebar__head { padding-inline: var(--space-4); }
.xxd-sidebar__body { display: grid; align-content: start; gap: var(--space-0-5); }
.xxd-sidebar__foot { flex-wrap: wrap; gap: var(--space-0-5); padding: var(--space-2); }
.rail-logo :deep(.logo-mark) { width: 24px; height: 24px; }
/* The sidebar's own icons are 18px; ours go through <Icon>, which defaults to 18px too. */
.xxd-sidebar__item > :deep(.ui-icon) { flex: none; }
.rail-toggle { margin-inline-start: auto; }
.xxd-sidebar[data-collapsed] .xxd-sidebar__head { justify-content: center; padding: 0; }
.xxd-sidebar[data-collapsed] .rail-logo :deep(span) { display: none; }
.xxd-sidebar[data-collapsed] .xxd-sidebar__foot { justify-content: center; }
.xxd-sidebar[data-collapsed] .rail-toggle { margin-inline-start: 0; }
/* Collapsed, the six items always fit: let their tooltips out of the scroll box. */
.xxd-sidebar[data-collapsed] .xxd-sidebar__body { overflow: visible; }

/* Collapsed: a tooltip names each destination (tooltip type: 11px, ink on paper-raised inverse). */
.rail [data-tooltip] { position: relative; }
.rail [data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  inset-inline-start: calc(100% + var(--space-3));
  top: 50%;
  z-index: var(--z-popover);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--r-xs);
  background: var(--ink);
  color: var(--on-ink);
  font: var(--weight-medium) var(--text-2xs) / var(--leading-xs) var(--font-body);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-50%);
}
.xxd-sidebar[data-collapsed] [data-tooltip]:is(:hover, :focus-visible)::before { opacity: 1; visibility: visible; }

/*
 * Hover / focus motion in the 小小东 rail vocabulary: strokes draw themselves (pathLength 100),
 * blocks assemble in sequence, parts slide a little. 480–760ms, one shared easing curve.
 */
.xxd-sidebar__item :deep(svg), .xxd-sidebar__item :deep(svg > *) { transform-box: fill-box; transform-origin: center; }
.xxd-sidebar__item[data-view="overview"]:is(:hover, :focus-visible) :deep(svg > path) { animation: rail-home-draw 720ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="overview"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(2)) { animation-delay: 80ms; }
.xxd-sidebar__item[data-view="sources"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(1)) { animation: rail-lift 720ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="sources"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(2)) { --slide: -2.5px; animation: rail-slide-draw 560ms 100ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="strategies"]:is(:hover, :focus-visible) :deep(svg > rect) { animation: rail-module-assemble 640ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="strategies"]:is(:hover, :focus-visible) :deep(svg > rect:nth-of-type(2)) { animation-delay: 80ms; }
.xxd-sidebar__item[data-view="strategies"]:is(:hover, :focus-visible) :deep(svg > rect:nth-of-type(3)) { animation-delay: 160ms; }
.xxd-sidebar__item[data-view="strategies"]:is(:hover, :focus-visible) :deep(svg > path) { animation: rail-stroke-draw 480ms 240ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="rules"]:is(:hover, :focus-visible) :deep(svg > path) { animation: rail-stroke-draw 520ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="rules"]:is(:hover, :focus-visible) :deep(svg > rect) { animation: rail-module-assemble 640ms 80ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="rules"]:is(:hover, :focus-visible) :deep(svg > rect:nth-of-type(2)) { animation-delay: 160ms; }
.xxd-sidebar__item[data-view="base"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(1)) { animation: rail-stroke-draw 520ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="base"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(2)) { --slide: 2px; animation: rail-slide 640ms 80ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="build"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(1)) { animation: rail-drop 640ms var(--ease-out-quint) both; }
.xxd-sidebar__item[data-view="build"]:is(:hover, :focus-visible) :deep(svg > path:nth-of-type(2)) { animation: rail-lift 720ms 220ms var(--ease-out-quint) both; }

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

@media (max-width: 640px) {
  /* Phones: the destinations become a bottom tab bar; logo, GitHub and the toggle step aside. */
  .rail {
    inset: auto 0 0 0;
    width: 100%;
    height: calc(60px + env(safe-area-inset-bottom));
    padding-bottom: env(safe-area-inset-bottom);
    border-right: 0;
    border-top: 1px solid var(--line);
  }
  .xxd-sidebar__head, .xxd-sidebar__foot { display: none; }
  .xxd-sidebar__body { grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0; padding: 0; overflow: visible; }
  .xxd-sidebar__item,
  .xxd-sidebar[data-collapsed] .xxd-sidebar__item {
    flex-direction: column;
    justify-content: center;
    gap: var(--space-0-5);
    height: 60px;
    padding: 0;
    border-radius: 0;
    font-size: var(--text-2xs);
    line-height: var(--leading-xs);
  }
  .xxd-sidebar__item > span,
  .xxd-sidebar[data-collapsed] .xxd-sidebar__item > span { position: static; width: 100%; flex: none; text-align: center; opacity: 1; }
  .rail [data-tooltip]::before { display: none; }
  .xxd-sidebar__item:is(:hover, :focus-visible) :deep(svg > *) { animation: none !important; }
  .xxd-sidebar__item:active :deep(svg) { transform: translateY(1px) scale(0.9); }
}

@media (prefers-reduced-motion: reduce) {
  .xxd-sidebar__item :deep(svg), .xxd-sidebar__item :deep(svg > *) { animation: none !important; transform: none !important; opacity: 1; }
}
</style>
