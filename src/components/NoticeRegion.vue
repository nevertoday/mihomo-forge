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
          <Icon :name="ICON[n.tone]" :size="16" class="app-notice-icon" />
          <p class="app-notice-text">{{ n.text }}</p>
          <button type="button" class="xxd-btn" data-variant="ghost" data-icon-only data-size="sm" :aria-label="t('common.close')" @click="store.dismiss(n.id)">
            <Icon name="X" :size="16" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* In flow, full width, a tone fill and a bottom rule only: no card border, no shadow. */
.notice-region { flex: none; position: relative; z-index: 15; }
.app-notice { --tone: var(--ink); background: color-mix(in srgb, var(--tone) 7%, var(--bg)); }
.app-notice[data-tone="success"] { --tone: var(--success); }
.app-notice[data-tone="warning"] { --tone: var(--warning); }
.app-notice[data-tone="error"] { --tone: var(--danger); }
.app-notice-content {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0 var(--space-3);
  min-height: 44px;
  padding: var(--space-0-5) calc(var(--gutter) - var(--space-2)) var(--space-0-5) var(--gutter);
  border-bottom: 1px solid color-mix(in srgb, var(--tone) 24%, var(--line));
}
.app-notice-icon { color: var(--tone); }
.app-notice-text { margin: 0; color: var(--ink); font: var(--weight-medium) var(--text-sm) / var(--leading-sm) var(--font-body); overflow-wrap: anywhere; }
/* Enter: fade in with a small shift; leave: fade out (no height animation). */
.notice-enter-active { transition: opacity var(--motion-medium) var(--ease-out-expo), transform var(--motion-medium) var(--ease-out-expo); }
.notice-leave-active { transition: opacity var(--motion-quick) ease; }
.notice-enter-from { opacity: 0; transform: translateY(-4px); }
.notice-leave-to { opacity: 0; }
</style>
