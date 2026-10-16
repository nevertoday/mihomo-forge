<script setup lang="ts">
import { confirmRequest, settleConfirm } from '@/app/confirm'
import { t } from '@/i18n'
import KitDialog from './KitDialog.vue'
</script>

<template>
  <!-- A confirmation must be answered: no backdrop dismiss; focus starts on the safe choice. -->
  <KitDialog v-if="confirmRequest" alert size="sm" labelledby="confirm-message" @close="settleConfirm(false)">
    <div class="xxd-dialog__head"><h2 id="confirm-message" class="xxd-dialog__title">{{ confirmRequest.message }}</h2></div>
    <div class="xxd-dialog__actions">
      <button type="button" class="xxd-btn ui-dialog-cancel" autofocus @click="settleConfirm(false)">{{ t('common.cancel') }}</button>
      <button type="button" class="xxd-btn" data-variant="danger" @click="settleConfirm(true)">{{ confirmRequest.confirmLabel }}</button>
    </div>
  </KitDialog>
</template>
