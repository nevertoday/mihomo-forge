/**
 * Base templates own everything except proxies / proxy-groups / rules / rule-providers:
 * ports, DNS, TUN, sniffer and profile. Mihomo Forge does not try to guess the perfect
 * DNS/TUN setup for every network (spec §22); these are conservative, widely used defaults.
 */

const FAKE_IP_FILTER = [
  '*.lan',
  '*.local',
  '*.localdomain',
  '+.msftconnecttest.com',
  '+.msftncsi.com',
  'time.*.com',
  'ntp.*.com',
  '+.pool.ntp.org',
  '+.stun.*.*',
  '+.stun.*.*.*',
  'localhost.ptlogin2.qq.com',
  '+.market.xiaomi.com',
]

const SNIFFER = {
  enable: true,
  'force-dns-mapping': true,
  'parse-pure-ip': true,
  sniff: {
    HTTP: { ports: [80, '8080-8880'], 'override-destination': true },
    TLS: { ports: [443, 8443] },
    QUIC: { ports: [443, 8443] },
  },
  'skip-domain': ['Mijia Cloud', '+.push.apple.com'],
}

const DOMESTIC_DOH = ['https://doh.pub/dns-query', 'https://dns.alidns.com/dns-query']

export const BASE_TEMPLATES = {
  /**
   * For OpenClash on OpenWrt. OpenClash rewrites ports / DNS listen / TUN from its own
   * LuCI settings when "覆写设置" is on, so these values mainly matter when it is off.
   */
  'openclash-standard': {
    port: 7890,
    'socks-port': 7891,
    'redir-port': 7892,
    'mixed-port': 7893,
    'tproxy-port': 7895,
    'allow-lan': true,
    'bind-address': '*',
    mode: 'rule',
    'log-level': 'info',
    ipv6: false,
    'unified-delay': true,
    'tcp-concurrent': true,
    'external-controller': '0.0.0.0:9090',
    'find-process-mode': 'off',
    profile: { 'store-selected': true, 'store-fake-ip': true },
    sniffer: SNIFFER,
    dns: {
      enable: true,
      listen: '0.0.0.0:7874',
      ipv6: false,
      'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16',
      'fake-ip-filter': FAKE_IP_FILTER,
      'default-nameserver': ['223.5.5.5', '119.29.29.29'],
      nameserver: DOMESTIC_DOH,
      'proxy-server-nameserver': DOMESTIC_DOH,
    },
  },
  /** For desktop Mihomo clients (Clash Verge Rev, Mihomo Party, FlClash, ...). */
  'mihomo-generic': {
    'mixed-port': 7890,
    'allow-lan': false,
    mode: 'rule',
    'log-level': 'info',
    ipv6: false,
    'unified-delay': true,
    'tcp-concurrent': true,
    'external-controller': '127.0.0.1:9090',
    'find-process-mode': 'strict',
    profile: { 'store-selected': true, 'store-fake-ip': true },
    sniffer: SNIFFER,
    tun: {
      enable: false,
      stack: 'mixed',
      'auto-route': true,
      'auto-detect-interface': true,
      'dns-hijack': ['any:53'],
    },
    dns: {
      enable: true,
      ipv6: false,
      'enhanced-mode': 'fake-ip',
      'fake-ip-range': '198.18.0.1/16',
      'fake-ip-filter': FAKE_IP_FILTER,
      'default-nameserver': ['223.5.5.5', '119.29.29.29'],
      nameserver: DOMESTIC_DOH,
      'proxy-server-nameserver': DOMESTIC_DOH,
    },
  },
} satisfies Record<string, Record<string, unknown>>

export type BuiltinTemplateId = keyof typeof BASE_TEMPLATES

/** Labels and descriptions live in the i18n messages (`base.templates.<id>`). */
export const TEMPLATE_IDS = ['openclash-standard', 'mihomo-generic', 'custom'] as const
