<script setup lang="ts">
import { t } from '@/i18n'
import Icon from './Icon.vue'
</script>

<template>
  <p class="privacy"><Icon name="LockKeyhole" :size="14" />{{ t('app.privacy') }}</p>
</template>

<style scoped>
.privacy { display: flex; align-items: center; gap: var(--space-1-5); margin: 0; color: var(--muted); font-size: var(--text-xs); line-height: var(--leading-sm); }
.privacy :deep(.ui-icon) { flex: none; }
</style>
