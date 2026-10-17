import { ref, watch } from 'vue'
import type { ViewId } from '@/stores/project'

/** One page does the job; advanced settings are a second, linkable view. */
const fromHash = (): ViewId => (location.hash.replace(/^#\/?/, '') === 'advanced' ? 'advanced' : 'home')

export const currentView = ref<ViewId>(fromHash())

window.addEventListener('hashchange', () => (currentView.value = fromHash()))
watch(currentView, (v) => {
  const hash = v === 'home' ? '' : `#/${v}`
  if (location.hash !== hash) history.replaceState(null, '', `${location.pathname}${location.search}${hash}`)
  // <main> owns scrolling, not the window.
  document.getElementById('content')?.scrollTo({ top: 0 })
})

export function go(view: ViewId) {
  currentView.value = view
}
