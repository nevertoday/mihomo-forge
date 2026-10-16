<script setup lang="ts">
import { t } from '@/i18n'
import Icon from './Icon.vue'
</script>

<template>
  <p class="notice notice-plain privacy"><Icon name="LockKeyhole" />{{ t('app.privacy') }}</p>
</template>

<style scoped>
.privacy { margin: 0; align-items: center; }
</style>
