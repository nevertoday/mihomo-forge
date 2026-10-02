import type { Locale, MessageParams, RegionDefinition, RuleService } from '@/types'

/**
 * Names written into the generated config.yaml. They depend on the project's
 * output language, not on the UI language, so a config does not change just
 * because the viewer switched languages.
 */
export interface Naming {
  globalManual: string
  globalAuto: string
  globalFallback: string
  regionManual: string
  regionAuto: string
  sourceManual: string
  sourceAuto: string
  composite: string
  /** Region id -> label. Unknown ids fall back to the region's own label. */
  regions: Record<string, string>
  /** Service id -> label, only for non-brand services. Brands keep their catalog label. */
  services: Record<string, string>
}

export const NAMING: Record<Locale, Naming> = {
  'zh-CN': {
    globalManual: '🌍 全部手动',
    globalAuto: '⚡ 全部自动',
    globalFallback: '🛡 故障转移',
    regionManual: '{icon} {region}手动',
    regionAuto: '{icon} {region}自动',
    sourceManual: '📦 {source}',
    sourceAuto: '📦 {source} 自动',
    composite: '{icon} {source} / {region}',
    regions: {
      us: '美国', jp: '日本', sg: '新加坡', hk: '香港', tw: '台湾', kr: '韩国', uk: '英国', de: '德国', fr: '法国',
      nl: '荷兰', ca: '加拿大', au: '澳大利亚', in: '印度', ru: '俄罗斯', tr: '土耳其', ar: '阿根廷', my: '马来西亚',
      th: '泰国', vn: '越南', ph: '菲律宾', other: '其他',
    },
    services: { lan: '局域网', china: '国内', foreign: '国外', ads: '广告拦截' },
  },
  'zh-TW': {
    globalManual: '🌍 全部手動',
    globalAuto: '⚡ 全部自動',
    globalFallback: '🛡 故障轉移',
    regionManual: '{icon} {region}手動',
    regionAuto: '{icon} {region}自動',
    sourceManual: '📦 {source}',
    sourceAuto: '📦 {source} 自動',
    composite: '{icon} {source} / {region}',
    regions: {
      us: '美國', jp: '日本', sg: '新加坡', hk: '香港', tw: '台灣', kr: '韓國', uk: '英國', de: '德國', fr: '法國',
      nl: '荷蘭', ca: '加拿大', au: '澳洲', in: '印度', ru: '俄羅斯', tr: '土耳其', ar: '阿根廷', my: '馬來西亞',
      th: '泰國', vn: '越南', ph: '菲律賓', other: '其他',
    },
    services: { lan: '區域網路', china: '中國大陸', foreign: '海外', ads: '廣告攔截' },
  },
  en: {
    globalManual: '🌍 All Manual',
    globalAuto: '⚡ All Auto',
    globalFallback: '🛡 Failover',
    regionManual: '{icon} {region} Manual',
    regionAuto: '{icon} {region} Auto',
    sourceManual: '📦 {source}',
    sourceAuto: '📦 {source} Auto',
    composite: '{icon} {source} / {region}',
    regions: {
      us: 'United States', jp: 'Japan', sg: 'Singapore', hk: 'Hong Kong', tw: 'Taiwan', kr: 'Korea', uk: 'United Kingdom',
      de: 'Germany', fr: 'France', nl: 'Netherlands', ca: 'Canada', au: 'Australia', in: 'India', ru: 'Russia',
      tr: 'Türkiye', ar: 'Argentina', my: 'Malaysia', th: 'Thailand', vn: 'Vietnam', ph: 'Philippines', other: 'Other',
    },
    services: { lan: 'LAN', china: 'Mainland China', foreign: 'Overseas', ads: 'Ad Block' },
  },
  ja: {
    globalManual: '🌍 すべて手動',
    globalAuto: '⚡ すべて自動',
    globalFallback: '🛡 フェイルオーバー',
    regionManual: '{icon} {region}・手動',
    regionAuto: '{icon} {region}・自動',
    sourceManual: '📦 {source}',
    sourceAuto: '📦 {source}・自動',
    composite: '{icon} {source} / {region}',
    regions: {
      us: 'アメリカ', jp: '日本', sg: 'シンガポール', hk: '香港', tw: '台湾', kr: '韓国', uk: 'イギリス', de: 'ドイツ',
      fr: 'フランス', nl: 'オランダ', ca: 'カナダ', au: 'オーストラリア', in: 'インド', ru: 'ロシア', tr: 'トルコ',
      ar: 'アルゼンチン', my: 'マレーシア', th: 'タイ', vn: 'ベトナム', ph: 'フィリピン', other: 'その他',
    },
    services: { lan: 'ローカルネットワーク', china: '中国本土', foreign: '海外', ads: '広告ブロック' },
  },
  ar: {
    globalManual: '🌍 الكل · يدوي',
    globalAuto: '⚡ الكل · تلقائي',
    globalFallback: '🛡 تجاوز الأعطال',
    regionManual: '{icon} {region} · يدوي',
    regionAuto: '{icon} {region} · تلقائي',
    sourceManual: '📦 {source}',
    sourceAuto: '📦 {source} · تلقائي',
    composite: '{icon} {source} / {region}',
    regions: {
      us: 'الولايات المتحدة', jp: 'اليابان', sg: 'سنغافورة', hk: 'هونغ كونغ', tw: 'تايوان', kr: 'كوريا',
      uk: 'المملكة المتحدة', de: 'ألمانيا', fr: 'فرنسا', nl: 'هولندا', ca: 'كندا', au: 'أستراليا', in: 'الهند',
      ru: 'روسيا', tr: 'تركيا', ar: 'الأرجنتين', my: 'ماليزيا', th: 'تايلاند', vn: 'فيتنام', ph: 'الفلبين', other: 'أخرى',
    },
    services: { lan: 'الشبكة المحلية', china: 'البر الصيني', foreign: 'الخارج', ads: 'حظر الإعلانات' },
  },
}

export function fill(template: string, params: MessageParams = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m))
}

export function regionLabel(region: Pick<RegionDefinition, 'id' | 'label'>, locale: Locale): string {
  return NAMING[locale].regions[region.id] ?? region.label
}

export function serviceLabel(service: Pick<RuleService, 'id' | 'label'>, locale: Locale): string {
  return NAMING[locale].services[service.id] ?? service.label
}
