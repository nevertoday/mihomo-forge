<script setup lang="ts">
import { t } from '@/i18n'
import { useProjectStore } from '@/stores/project'
import Icon from './Icon.vue'
import type { IconName } from './icons'

const store = useProjectStore()
const ICON: Record<string, IconName> = { info: 'Info', success: 'CircleCheck', warning: 'TriangleAlert', error: 'CircleX' }
</script>

<template>
  <div class="notice-region" role="status" aria-live="polite">
    <TransitionGroup name="notice">
      <div v-for="n in store.toasts" :key="n.id" class="app-notice" :data-tone="n.tone">
        <div class="app-notice-content">
          <Icon :name="ICON[n.tone]" class="app-notice-icon" />
          <p class="app-notice-text">{{ n.text }}</p>
          <button type="button" class="app-notice-close" :aria-label="t('common.close')" @click="store.dismiss(n.id)">
            <Icon name="X" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* In flow, full width, tone background and a bottom rule only: no card border, no shadow. */
.notice-region { flex: none; position: relative; z-index: 15; }
.app-notice {
  --tone-ink: var(--notice-info-ink);
  --tone-bg: var(--notice-info-bg);
  --tone-border: var(--notice-info-border);
  max-height: 160px;
  overflow: hidden;
  background: var(--tone-bg);
}
.app-notice[data-tone="success"] { --tone-ink: var(--notice-success-ink); --tone-bg: var(--notice-success-bg); --tone-border: var(--notice-success-border); }
.app-notice[data-tone="warning"] { --tone-ink: var(--notice-warning-ink); --tone-bg: var(--notice-warning-bg); --tone-border: var(--notice-warning-border); }
.app-notice[data-tone="error"] { --tone-ink: var(--notice-error-ink); --tone-bg: var(--notice-error-bg); --tone-border: var(--notice-error-border); }
.app-notice-content {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) 40px;
  align-items: center;
  gap: 0 10px;
  min-height: 44px;
  min-width: 0;
  padding: 0 var(--gutter);
  border-bottom: 1px solid color-mix(in srgb, var(--tone-border) 30%, var(--tone-ink));
}
.app-notice-icon { color: var(--tone-ink); }
.app-notice-text { margin: 0; color: var(--ink); font-size: 13px; font-weight: 500; line-height: 1.5; overflow-wrap: anywhere; }
.app-notice-close { display: grid; place-items: center; min-height: 40px; padding: 0; border: 0; color: var(--muted); background: transparent; }
.app-notice-close:hover { color: var(--ink); }
.notice-enter-active, .notice-leave-active { transition: max-height 220ms ease, opacity 200ms ease; }
.notice-enter-from, .notice-leave-to { max-height: 0; opacity: 0; }
@media (prefers-reduced-motion: reduce) { .notice-enter-active, .notice-leave-active { transition: none; } }
</style>
