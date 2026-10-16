/**
 * Interface icons, drawn in the 小小东 site's icon language (site-icons.js, same author):
 * 24-unit grid, 1.5-unit strokes, round caps, miter joins, square frames.
 * Common controls are redrawn rather than taken from stock Lucide shapes.
 */
type Node = [tag: 'path' | 'rect' | 'circle', attrs: Record<string, string | number>]

const path = (d: string): Node => ['path', { d }]
const rect = (x: number, y: number, width: number, height: number): Node => ['rect', { x, y, width, height }]
const circle = (cx: number, cy: number, r: number): Node => ['circle', { cx, cy, r }]
const draw = (...parts: (string | Node)[]): Node[] => parts.map((p) => (typeof p === 'string' ? path(p) : p))

const page = rect(5, 3.5, 14, 17)
const folder = path('M3.5 19.5v-15h6L12 7h8.5v12.5Z')
const trash = draw('M4 6.5h16M9 6.5V3.5h6v3', 'M6 6.5v14h12v-14', 'M10 10v7m4-7v7')
const sliders = draw('M4 7h8m4 0h4M4 17h3m4 0h9', 'M12 4v6m-5 4v6')

export const ICONS = {
  House: draw('m4 10 8-6.5 8 6.5', 'M6 8.5V20h4v-6h4v6h4V8.5'),
  FolderInput: draw(folder, 'M7 13h10m-3-3 3 3-3 3'),
  Network: draw(rect(9, 3.5, 6, 5), rect(3, 16, 6, 5), rect(15, 16, 6, 5), 'M12 8.5v4M6 16v-3.5h12V16'),
  ListTree: draw('M5 3.5V18h5M5 8h5', rect(13, 5, 7, 6), rect(13, 15, 7, 6)),
  Settings: sliders,
  Download: draw('M12 3v12m-5-5 5 5 5-5', 'M4 15v5.5h16V15'),
  FileUp: draw(page, 'M12 17V7m-3 3 3-3 3 3'),
  FileDown: draw(page, 'M12 7v10m-3-3 3 3 3-3'),
  Code: draw('m8 6-5 6 5 6', 'm16 6 5 6-5 6', 'm14 4-4 16'),
  Trash: trash,
  X: draw('m6 6 12 12M18 6 6 18'),
  Plus: draw('M12 5v14M5 12h14'),
  Check: draw('m6 12 4 4 8-8'),
  Pencil: draw('m4 16 12-12 4 4-12 12-5 1Z', 'm14 6 4 4'),
  RotateCcw: draw('M4 10a8.5 8.5 0 1 1 1 8M4 4v6h6'),
  Copy: draw(rect(8, 8, 12, 12), 'M16 4H4v12'),
  Eye: draw('M3 12q9-13 18 0-9 13-18 0Z', circle(12, 12, 2.5)),
  Search: draw(circle(10.5, 10.5, 6.5), 'm15.5 15.5 5 5'),
  ArrowUp: draw('M12 20V4m-6 6 6-6 6 6'),
  ArrowDown: draw('M12 4v16m-6-6 6 6 6-6'),
  ArrowLeft: draw('M20 12H4m6-6-6 6 6 6'),
  ArrowRight: draw('M4 12h16m-6-6 6 6-6 6'),
  CircleCheck: draw(circle(12, 12, 8.5), 'm7.5 12 3 3 6-6'),
  CircleX: draw(circle(12, 12, 8.5), 'm9 9 6 6m0-6-6 6'),
  Info: draw(circle(12, 12, 8.5), 'M12 11v6m0-10h.01'),
  TriangleAlert: draw('m12 3 10 18H2Z', 'M12 9v5m0 3h.01'),
  Sparkles: draw('m9 8 1.8 4.2L15 14l-4.2 1.8L9 20l-1.8-4.2L3 14l4.2-1.8Z', 'M18 3v7m-3.5-3.5h7'),
  WandSparkles: draw('m4 17 12-12 3 3L7 20Z', 'm13 8 3 3M6 3v5M3.5 5.5h5M19 15v6m-3-3h6'),
  Languages: draw('M3 6h11M8.5 3v3m3.5 0c-1 5-4 8-8.5 10M5 9c1 3 3.5 5.5 7 7', 'm13 21 4-11 4 11m-6.5-4h5'),
  Moon: draw('M19.5 15.5A8.5 8.5 0 0 1 8.5 4.5a8.5 8.5 0 1 0 11 11Z'),
  Sun: draw(circle(12, 12, 4), 'M12 3v2', 'm17 7 1.5-1.5', 'M19 12h2', 'm17 17 1.5 1.5', 'M12 19v2', 'm5.5 18.5 1.5-1.5', 'M3 12h2', 'm5.5 5.5 1.5 1.5'),
  PanelLeft: draw(rect(3.5, 3.5, 17, 17), 'M9 3.5v17'),
  LockKeyhole: draw(rect(5, 10, 14, 10.5), 'M8 10V7a4 4 0 0 1 8 0v3M12 14v3'),
  // The site header's GitHub mark (an outline, like every other icon).
  Github: draw(
    'M15 22v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 19 4.77 5.07 5.07 0 0 0 18.91 1S17.73.65 15 2.48a13.38 13.38 0 0 0-7 0C5.27.65 4.09 1 4.09 1A5.07 5.07 0 0 0 4 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 8 18.13V22',
    'M8 19c-3 .9-5.5 0-7-2',
  ),
} satisfies Record<string, Node[]>

export type IconName = keyof typeof ICONS
