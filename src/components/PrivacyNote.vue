<script setup lang="ts">
import { t } from '@/i18n'
import Icon from './Icon.vue'
</script>

<template>
  <div class="xxd-banner privacy" data-size="sm"><Icon name="LockKeyhole" :size="16" /><p class="xxd-banner__title">{{ t('app.privacy') }}</p></div>
</template>

<style scoped>
.privacy { margin: 0; align-items: center; }
</style>
