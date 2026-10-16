import type { IconName } from '@/components/icons'
import { ref, watch } from 'vue'
import type { ViewId } from '@/stores/project'

/** Labels are the `nav.<id>` messages; they double as page titles. */
export const NAV_ITEMS: { id: ViewId; icon: IconName }[] = [
  { id: 'overview', icon: 'House' },
  { id: 'sources', icon: 'FolderInput' },
  { id: 'strategies', icon: 'Network' },
  { id: 'rules', icon: 'ListTree' },
  { id: 'base', icon: 'Settings' },
  { id: 'build', icon: 'Download' },
]

const ids = NAV_ITEMS.map((n) => n.id)
const fromHash = (): ViewId => {
  const h = location.hash.replace(/^#\/?/, '') as ViewId
  return ids.includes(h) ? h : 'overview'
}

/** Hash routing keeps every page linkable on static hosts without a router dependency. */
export const currentView = ref<ViewId>(fromHash())

window.addEventListener('hashchange', () => (currentView.value = fromHash()))
watch(currentView, (v) => {
  if (fromHash() !== v) location.hash = `/${v}`
  // <main> owns scrolling, not the window.
  document.getElementById('content')?.scrollTo({ top: 0 })
})

/** The first-run wizard covers the page; any navigation (even to the current page) leaves it. */
export const wizardOpen = ref(false)

export function go(view: ViewId) {
  wizardOpen.value = false
  currentView.value = view
}
