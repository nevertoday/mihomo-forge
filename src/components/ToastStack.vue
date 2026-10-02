<script setup lang="ts">
import { useProjectStore } from '@/stores/project'
const store = useProjectStore()
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <p v-for="t in store.toasts" :key="t.id" class="notice toast" :class="`notice-${t.tone === 'info' ? 'plain' : t.tone}`">{{ t.text }}</p>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  z-index: 80;
  top: calc(var(--topbar-height) + 12px);
  inset-inline-end: var(--gutter);
  display: grid;
  gap: 8px;
  width: min(420px, calc(100vw - 32px));
  pointer-events: none;
}
.toast { margin: 0; box-shadow: var(--ui-shadow-popover); pointer-events: auto; }
.toast-enter-active, .toast-leave-active { transition: opacity 180ms ease, transform 180ms ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
