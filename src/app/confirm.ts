import { shallowRef } from 'vue'

export interface ConfirmRequest {
  message: string
  confirmLabel: string
  resolve: (ok: boolean) => void
}

/** One in-app confirmation at a time; replaces the browser's native confirm(). */
export const confirmRequest = shallowRef<ConfirmRequest | null>(null)

export function askConfirm(message: string, confirmLabel: string): Promise<boolean> {
  confirmRequest.value?.resolve(false)
  return new Promise((resolve) => {
    confirmRequest.value = { message, confirmLabel, resolve }
  })
}

export function settleConfirm(ok: boolean) {
  const req = confirmRequest.value
  confirmRequest.value = null
  req?.resolve(ok)
}
