import { FileCog, FolderInput, Hammer, LayoutDashboard, ListTree, Network } from 'lucide-vue-next'
import { ref, watch } from 'vue'
import type { ViewId } from '@/stores/project'

/** Labels are the `nav.<id>` messages; they double as page titles. */
export const NAV_ITEMS: { id: ViewId; icon: unknown }[] = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'sources', icon: FolderInput },
  { id: 'strategies', icon: Network },
  { id: 'rules', icon: ListTree },
  { id: 'base', icon: FileCog },
  { id: 'build', icon: Hammer },
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
  window.scrollTo({ top: 0 })
})

export function go(view: ViewId) {
  currentView.value = view
}
