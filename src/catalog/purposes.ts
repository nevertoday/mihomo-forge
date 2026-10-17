import type { Locale, LineRef, Purpose, PurposeMode } from '@/types'

/**
 * The purposes a new project starts with: one group per use, the way people actually arrange
 * OpenClash (ChatGPT, other AI, Google, Telegram, streaming, Netflix, Apple, Microsoft, everything
 * else overseas). Mainland China and the LAN always go direct and are not purposes.
 */
interface PurposeTemplate {
  id: string
  icon: string
  names: Record<Locale, string>
  services: string[]
  lines: LineRef[]
  mode?: PurposeMode
}

/** The catch-all: overseas traffic no other purpose claimed (rule set + MATCH). It cannot be removed. */
export const FOREIGN_PURPOSE_ID = 'foreign'

/** Lines that do not exist in the current files (no US nodes, say) are skipped at build time. */
const PREFER_US: LineRef[] = ['region:us', 'region:jp', 'region:sg', 'all']
const PREFER_ASIA: LineRef[] = ['region:sg', 'region:jp', 'region:hk', 'region:us', 'all']

export const PURPOSE_TEMPLATES: PurposeTemplate[] = [
  {
    id: 'chatgpt',
    icon: '🤖',
    names: { 'zh-CN': 'ChatGPT', 'zh-TW': 'ChatGPT', en: 'ChatGPT', ja: 'ChatGPT', ar: 'ChatGPT' },
    services: ['chatgpt'],
    lines: PREFER_US,
  },
  {
    id: 'ai',
    icon: '🧠',
    names: { 'zh-CN': 'AI 工具', 'zh-TW': 'AI 工具', en: 'AI Tools', ja: 'AI ツール', ar: 'أدوات الذكاء الاصطناعي' },
    services: ['claude', 'gemini', 'grok', 'perplexity', 'copilot', 'groq', 'meta-ai'],
    lines: PREFER_US,
  },
  {
    id: 'google',
    icon: '🔍',
    names: { 'zh-CN': '谷歌', 'zh-TW': 'Google', en: 'Google', ja: 'Google', ar: 'Google' },
    services: ['google'],
    lines: ['all'],
  },
  {
    id: 'telegram',
    icon: '✈️',
    names: { 'zh-CN': '电报', 'zh-TW': 'Telegram', en: 'Telegram', ja: 'Telegram', ar: 'تيليجرام' },
    services: ['telegram'],
    lines: PREFER_ASIA,
  },
  {
    id: 'media',
    icon: '🎬',
    names: { 'zh-CN': '影音', 'zh-TW': '影音', en: 'Streaming', ja: '動画・音楽', ar: 'البث' },
    services: ['youtube', 'disney', 'hbo', 'spotify', 'primevideo', 'twitch', 'tiktok'],
    lines: PREFER_ASIA,
  },
  {
    id: 'netflix',
    icon: '🎞',
    names: { 'zh-CN': '奈飞', 'zh-TW': 'Netflix', en: 'Netflix', ja: 'Netflix', ar: 'Netflix' },
    services: ['netflix'],
    lines: PREFER_ASIA,
  },
  {
    id: 'apple',
    icon: '🍎',
    names: { 'zh-CN': '苹果', 'zh-TW': 'Apple', en: 'Apple', ja: 'Apple', ar: 'Apple' },
    services: ['apple'],
    lines: ['DIRECT', 'all'],
  },
  {
    id: 'microsoft',
    icon: '🪟',
    names: { 'zh-CN': '微软', 'zh-TW': '微軟', en: 'Microsoft', ja: 'Microsoft', ar: 'Microsoft' },
    services: ['microsoft'],
    lines: ['DIRECT', 'all'],
  },
  {
    id: FOREIGN_PURPOSE_ID,
    icon: '🌐',
    names: { 'zh-CN': '其它国外', 'zh-TW': '其他海外', en: 'Other Overseas', ja: 'その他の海外', ar: 'باقي المواقع الخارجية' },
    services: ['foreign'],
    lines: ['all'],
  },
]

/** Optional purposes offered in “add a purpose”, besides a fully custom one. */
export const EXTRA_PURPOSE_TEMPLATES: PurposeTemplate[] = [
  {
    id: 'developer',
    icon: '🧑‍💻',
    names: { 'zh-CN': '开发', 'zh-TW': '開發', en: 'Developer', ja: '開発', ar: 'المطورون' },
    services: ['github', 'gitlab', 'docker'],
    lines: ['all'],
  },
  {
    id: 'social',
    icon: '💬',
    names: { 'zh-CN': '社交', 'zh-TW': '社群', en: 'Social', ja: 'SNS', ar: 'التواصل' },
    services: ['twitter', 'reddit', 'facebook', 'whatsapp', 'instagram', 'discord'],
    lines: ['all'],
  },
  {
    id: 'gaming',
    icon: '🎮',
    names: { 'zh-CN': '游戏', 'zh-TW': '遊戲', en: 'Gaming', ja: 'ゲーム', ar: 'الألعاب' },
    services: ['steam', 'epic', 'playstation'],
    lines: ['DIRECT', 'all'],
  },
  {
    id: 'crypto',
    icon: '🪙',
    names: { 'zh-CN': '加密货币', 'zh-TW': '加密貨幣', en: 'Crypto', ja: '暗号資産', ar: 'العملات المشفرة' },
    services: ['binance', 'okx'],
    lines: PREFER_ASIA,
  },
  {
    id: 'ads',
    icon: '🛑',
    names: { 'zh-CN': '广告拦截', 'zh-TW': '廣告攔截', en: 'Ad Block', ja: '広告ブロック', ar: 'حظر الإعلانات' },
    services: ['ads'],
    lines: ['REJECT', 'DIRECT'],
    mode: 'select',
  },
]

export function purposeFromTemplate(t: PurposeTemplate, locale: Locale): Purpose {
  return {
    id: t.id,
    name: `${t.icon} ${t.names[locale]}`,
    services: [...t.services],
    domains: [],
    lines: [...t.lines],
    mode: t.mode ?? 'fallback',
  }
}

export function createDefaultPurposes(locale: Locale): Purpose[] {
  return PURPOSE_TEMPLATES.map((t) => purposeFromTemplate(t, locale))
}

const ALL_TEMPLATES = [...PURPOSE_TEMPLATES, ...EXTRA_PURPOSE_TEMPLATES]

/**
 * The name written into config.yaml. A built-in purpose the user never renamed follows the
 * output language; a renamed one keeps exactly what the user typed.
 */
export function purposeName(purpose: Purpose, locale: Locale): string {
  const t = ALL_TEMPLATES.find((x) => x.id === purpose.id)
  if (!t) return purpose.name
  const untouched = Object.values(t.names).some((n) => purpose.name === `${t.icon} ${n}`)
  return untouched ? `${t.icon} ${t.names[locale]}` : purpose.name
}

/**
 * Default lines list preferences (“US, then Japan, then Singapore…”). Once files are imported, a
 * purpose still on its factory lines keeps only the ones those files have, so the page shows what
 * will actually be used. Lines the user changed are never touched.
 */
export function tidyDefaultLines(purposes: Purpose[], exists: (ref: LineRef) => boolean): void {
  for (const p of purposes) {
    const t = ALL_TEMPLATES.find((x) => x.id === p.id)
    if (!t || p.lines.length !== t.lines.length || p.lines.some((ref, i) => ref !== t.lines[i])) continue
    const kept = p.lines.filter(exists)
    if (kept.length && kept.length < p.lines.length) p.lines = kept
  }
}
