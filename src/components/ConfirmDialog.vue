<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { confirmRequest, settleConfirm } from '@/app/confirm'
import { t } from '@/i18n'

const cancelButton = ref<HTMLButtonElement>()
const onKey = (e: KeyboardEvent) => e.key === 'Escape' && settleConfirm(false)

watch(confirmRequest, async (req) => {
  if (req) {
    window.addEventListener('keydown', onKey)
    await nextTick()
    // Destructive dialogs start on the safe choice.
    cancelButton.value?.focus()
  } else window.removeEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="confirmRequest" class="overlay" @click.self="settleConfirm(false)">
    <section class="dialog confirm" role="alertdialog" aria-modal="true" aria-describedby="confirm-message">
      <div class="dialog-body">
        <p id="confirm-message">{{ confirmRequest.message }}</p>
      </div>
      <footer class="dialog-foot">
        <button ref="cancelButton" type="button" class="btn btn-cancel" @click="settleConfirm(false)">{{ t('common.cancel') }}</button>
        <button type="button" class="btn btn-danger-solid" @click="settleConfirm(true)">{{ confirmRequest.confirmLabel }}</button>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.confirm { width: min(100%, 440px); }
.confirm p { margin: 0; font-size: 15px; line-height: 1.6; }
</style>
