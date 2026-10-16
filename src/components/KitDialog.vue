<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

/**
 * The 小小东 UI Kit dialog (.xxd-dialog) on a native <dialog>: showModal gives the top layer,
 * focus trapping and Esc for free. Mount it with v-if; Esc and (optionally) the backdrop emit `close`.
 */
const props = withDefaults(
  defineProps<{ size?: 'sm' | 'lg' | 'xl'; alert?: boolean; lightDismiss?: boolean; labelledby?: string; label?: string }>(),
  { size: undefined, alert: false, lightDismiss: false, labelledby: undefined, label: undefined },
)
const emit = defineEmits<{ close: [] }>()
const el = ref<HTMLDialogElement>()

onMounted(() => el.value?.showModal())
onUnmounted(() => el.value?.open && el.value.close())

function onCancel(e: Event) {
  e.preventDefault()
  emit('close')
}
function onClick(e: MouseEvent) {
  if (props.lightDismiss && e.target === el.value) emit('close')
}
</script>

<template>
  <dialog
    ref="el"
    class="xxd-dialog"
    :data-size="size"
    :role="alert ? 'alertdialog' : undefined"
    :aria-labelledby="labelledby"
    :aria-label="label"
    @cancel="onCancel"
    @click="onClick"
  >
    <slot />
  </dialog>
</template>
