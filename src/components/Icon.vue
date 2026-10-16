<script setup lang="ts">
import { h } from 'vue'
import { ICONS, type IconName } from './icons'

/** Toolbar icons are 18px, rail icons 20px. Active states change color, never stroke weight. */
const props = withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 18 })

// pathLength=100 lets CSS draw any stroke with dash offsets (used by the rail animations).
const Shape = () => ICONS[props.name].map(([tag, attrs]) => h(tag, tag === 'circle' ? attrs : { pathLength: 100, ...attrs }))
</script>

<template>
  <svg
    class="ui-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="miter"
    aria-hidden="true"
    focusable="false"
  >
    <Shape />
  </svg>
</template>
