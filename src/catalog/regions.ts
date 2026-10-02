import type { RegionDefinition } from '@/types'

/**
 * Build a case-insensitive pattern for a short country code such as `US`.
 * `\bUS\b` would miss names like `US01`, and plain `US` would hit `Russia`,
 * so the code must not touch another letter on the right or a letter/digit on the left
 * (the left digit guard keeps `100GB` from being read as Great Britain).
 */
export const code = (c: string): string => `(?<![a-z0-9])${c}(?![a-z])`

export const OTHER_REGION_ID = 'other'

/**
 * Region catalog. Patterns are regular expressions (matched case-insensitively)
 * against the node's ORIGINAL name, never the prefixed display name.
 * When several regions match, the highest priority wins and a warning is recorded.
 */
export const DEFAULT_REGIONS: RegionDefinition[] = [
  {
    id: 'us',
    label: '美国',
    icon: '🇺🇸',
    patterns: [
      '美国', '美國', '🇺🇸', 'United\\s*States', code('US'), code('USA'),
      '洛杉矶', '圣何塞', '西雅图', '纽约', '达拉斯', '芝加哥', '硅谷', '凤凰城', '波特兰', '弗吉尼亚', '迈阿密', '亚特兰大',
      'Los\\s*Angeles', 'San\\s*Jose', 'Seattle', 'New\\s*York', 'Dallas', 'Chicago', 'Silicon\\s*Valley',
      'Phoenix', 'Portland', 'Virginia', 'Miami', 'Atlanta',
    ],
    priority: 100,
  },
  {
    id: 'jp',
    label: '日本',
    icon: '🇯🇵',
    patterns: ['日本', '东京', '東京', '大阪', '埼玉', '🇯🇵', 'Japan', 'Tokyo', 'Osaka', code('JP'), code('JPN')],
    priority: 95,
  },
  {
    id: 'sg',
    label: '新加坡',
    icon: '🇸🇬',
    patterns: ['新加坡', '狮城', '獅城', '🇸🇬', 'Singapore', code('SG'), code('SGP')],
    priority: 90,
  },
  {
    id: 'hk',
    label: '香港',
    icon: '🇭🇰',
    patterns: ['香港', '🇭🇰', 'Hong\\s*Kong', code('HK'), code('HKG')],
    priority: 70,
  },
  {
    id: 'tw',
    label: '台湾',
    icon: '🇹🇼',
    patterns: ['台湾', '台灣', '台北', '新北', '彰化', '🇹🇼', 'Taiwan', 'Taipei', code('TW'), code('TWN')],
    priority: 75,
  },
  {
    id: 'kr',
    label: '韩国',
    icon: '🇰🇷',
    patterns: ['韩国', '韓國', '首尔', '首爾', '春川', '🇰🇷', 'Korea', 'Seoul', code('KR'), code('KOR')],
    priority: 80,
  },
  {
    id: 'uk',
    label: '英国',
    icon: '🇬🇧',
    patterns: ['英国', '英國', '伦敦', '倫敦', '🇬🇧', 'United\\s*Kingdom', 'Britain', 'London', code('UK'), code('GB')],
    priority: 85,
  },
  {
    id: 'de',
    label: '德国',
    icon: '🇩🇪',
    patterns: ['德国', '德國', '法兰克福', '🇩🇪', 'Germany', 'Frankfurt', code('DE')],
    priority: 60,
  },
  {
    id: 'fr',
    label: '法国',
    icon: '🇫🇷',
    patterns: ['法国', '法國', '巴黎', '🇫🇷', 'France', 'Paris', code('FR')],
    priority: 60,
  },
  {
    id: 'nl',
    label: '荷兰',
    icon: '🇳🇱',
    patterns: ['荷兰', '荷蘭', '阿姆斯特丹', '🇳🇱', 'Netherlands', 'Amsterdam', code('NL')],
    priority: 60,
  },
  {
    id: 'ca',
    label: '加拿大',
    icon: '🇨🇦',
    patterns: ['加拿大', '多伦多', '温哥华', '🇨🇦', 'Canada', 'Toronto', 'Vancouver', code('CA')],
    priority: 60,
  },
  {
    id: 'au',
    label: '澳大利亚',
    icon: '🇦🇺',
    patterns: ['澳大利亚', '澳洲', '悉尼', '墨尔本', '🇦🇺', 'Australia', 'Sydney', 'Melbourne', code('AU')],
    priority: 60,
  },
  {
    id: 'in',
    label: '印度',
    icon: '🇮🇳',
    patterns: ['印度', '孟买', '🇮🇳', 'India', 'Mumbai', code('IN')],
    priority: 55,
  },
  {
    id: 'ru',
    label: '俄罗斯',
    icon: '🇷🇺',
    patterns: ['俄罗斯', '俄羅斯', '莫斯科', '🇷🇺', 'Russia', 'Moscow', code('RU')],
    priority: 55,
  },
  {
    id: 'tr',
    label: '土耳其',
    icon: '🇹🇷',
    patterns: ['土耳其', '伊斯坦布尔', '🇹🇷', 'Turkey', 'Türkiye', 'Istanbul', code('TR')],
    priority: 55,
  },
  {
    id: 'ar',
    label: '阿根廷',
    icon: '🇦🇷',
    patterns: ['阿根廷', '🇦🇷', 'Argentina', code('AR')],
    priority: 55,
  },
  {
    id: 'my',
    label: '马来西亚',
    icon: '🇲🇾',
    patterns: ['马来西亚', '馬來西亞', '吉隆坡', '🇲🇾', 'Malaysia', 'Kuala\\s*Lumpur', code('MY')],
    priority: 55,
  },
  {
    id: 'th',
    label: '泰国',
    icon: '🇹🇭',
    patterns: ['泰国', '泰國', '曼谷', '🇹🇭', 'Thailand', 'Bangkok', code('TH')],
    priority: 55,
  },
  {
    id: 'vn',
    label: '越南',
    icon: '🇻🇳',
    patterns: ['越南', '🇻🇳', 'Vietnam', code('VN')],
    priority: 55,
  },
  {
    id: 'ph',
    label: '菲律宾',
    icon: '🇵🇭',
    patterns: ['菲律宾', '菲律賓', '马尼拉', '🇵🇭', 'Philippines', 'Manila', code('PH')],
    priority: 55,
  },
  {
    id: OTHER_REGION_ID,
    label: '其他',
    icon: '🏳️',
    patterns: [],
    priority: 0,
  },
]

/** Regions switched on in a new project (spec §7 Step 3). */
export const DEFAULT_ENABLED_REGION_IDS = ['us', 'jp', 'sg', 'hk', 'tw', 'kr', 'uk', OTHER_REGION_ID]
