/**
 * Interface icons come from the 小小东 UI Kit (@xxd/icons, synced into src/vendor by `xxd-ui sync`):
 * 24-unit grid, 1.5 strokes, round caps, miter joins, square frames.
 * Brand marks keep their own drawing, so GitHub is the one local glyph.
 */
import { ICON_NODES, type IconNode } from '@/vendor/xxd-icon-nodes.js'

const USED = [
  'House', 'FolderInput', 'Network', 'ListTree', 'Settings', 'Download', 'FileUp', 'FileDown', 'Code', 'Trash', 'X',
  'Plus', 'Check', 'Pencil', 'RotateCcw', 'Copy', 'Eye', 'Search', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'CircleCheck', 'CircleX', 'Info', 'TriangleAlert', 'Sparkles', 'WandSparkles', 'Languages', 'Moon', 'Sun',
  'PanelLeft', 'LockKeyhole',
] as const

const BRAND = {
  Github: [
    ['path', { d: 'M15 22v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-7 0C5.27.65 4.09 1 4.09 1A5.07 5.07 0 0 0 4 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22' }],
    ['path', { d: 'M8 19c-3 .9-5.5 0-7-2' }],
  ] as IconNode[],
}

export type IconName = (typeof USED)[number] | keyof typeof BRAND

export const ICONS = {
  ...(Object.fromEntries(USED.map((name) => [name, ICON_NODES[name]])) as Record<(typeof USED)[number], IconNode[]>),
  ...BRAND,
} satisfies Record<IconName, IconNode[]>
