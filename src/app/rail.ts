import { ref, watch } from 'vue'

/** Expanded (icons + labels) by default, like the 小小东 site; the viewer's choice is remembered. */
const KEY = 'mihomo-forge-rail'

function read(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'collapsed'
  } catch {
    return true
  }
}

export const railExpanded = ref(read())

function apply(expanded: boolean) {
  document.documentElement.dataset.rail = expanded ? 'expanded' : 'collapsed'
}

apply(railExpanded.value)
watch(railExpanded, (v) => {
  apply(v)
  try {
    localStorage.setItem(KEY, v ? 'expanded' : 'collapsed')
  } catch {
    // storage can be unavailable
  }
})

export function toggleRail() {
  railExpanded.value = !railExpanded.value
}
