/**
 * Real-core compatibility check. Runs only when MIHOMO_BIN points at a Mihomo binary
 * (CI downloads one; locally: `MIHOMO_BIN=/path/to/mihomo npm test`).
 *
 * Each generated config is first rewritten the way OpenClash does it — loaded and dumped
 * by Ruby's YAML (1.1) — and must come back unchanged, then pass `mihomo -t`.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { buildConfig } from '@/core/builder'
import { EXTRA_PURPOSE_TEMPLATES, purposeFromTemplate } from '@/catalog/purposes'
import type { Locale, ProjectSettings } from '@/types'
import { exampleSources, settings } from '../helpers'

const MIHOMO = process.env.MIHOMO_BIN
const HAS_RUBY = spawnSync('ruby', ['-v']).status === 0

const RUBY_ROUNDTRIP = `
require 'yaml'; require 'json'
data = YAML.safe_load(File.read(ARGV[0]))
File.write(ARGV[1], data.to_yaml)
puts JSON.generate(data)
`

const LOCALES: Locale[] = ['zh-CN', 'zh-TW', 'en', 'ja', 'ar']
/** default purposes · every optional purpose · advanced lines and custom sites */
const VARIANTS = ['default', 'all', 'advanced'] as const
const TEMPLATES: ProjectSettings['base']['templateId'][] = ['openclash-standard', 'mihomo-generic']

describe.skipIf(!MIHOMO)('Mihomo core accepts every generated config', () => {
  for (const locale of LOCALES)
    for (const variant of VARIANTS)
      for (const tpl of TEMPLATES)
        it(`${locale} · ${variant} · ${tpl}`, async () => {
          const sources = await exampleSources()
          const r = buildConfig(
            sources,
            settings((s) => {
              s.outputLocale = locale
              s.base.templateId = tpl
              if (variant !== 'default') s.purposes.push(...EXTRA_PURPOSE_TEMPLATES.map((t) => purposeFromTemplate(t, locale)))
              if (variant === 'advanced') {
                s.strategy.composites.push({ id: 'c1', sourceId: sources[0].id, regionId: 'us', mode: 'url-test' })
                s.strategy.filters.push({
                  id: 'f1', name: '🔎 美国 日本', include: ['美国', '日本'], exclude: ['东京'], regex: false,
                  sourceIds: [], regionId: null, mode: 'fallback',
                })
                const chatgpt = s.purposes.find((p) => p.id === 'chatgpt')!
                chatgpt.lines = ['filter:f1', 'composite:c1', `node:${sources[1].nodes[0].fingerprint}`, `source:${sources[2].id}`, 'all', 'DIRECT']
                chatgpt.domains = ['chatgpt.com', 'oaiusercontent.com', 'openai']
                s.purposes.push({ id: 'custom1', name: '🎨 作图', services: [], domains: ['midjourney.com'], lines: ['region:jp', 'all'], mode: 'select' })
              }
            }),
          )
          expect(r.ok).toBe(true)

          const dir = mkdtempSync(join(tmpdir(), 'mihomo-forge-'))
          let file = join(dir, 'config.yaml')
          writeFileSync(file, r.yaml)

          if (HAS_RUBY) {
            const rewritten = join(dir, 'openclash.yaml')
            const ruby = spawnSync('ruby', ['-e', RUBY_ROUNDTRIP, file, rewritten], { encoding: 'utf8' })
            expect(ruby.status, ruby.stderr).toBe(0)
            expect(JSON.parse(ruby.stdout)).toEqual(parse(readFileSync(file, 'utf8')))
            file = rewritten
          }

          const test = spawnSync(MIHOMO!, ['-t', '-d', dir, '-f', file], { encoding: 'utf8' })
          expect(test.stdout + test.stderr).toContain('test is successful')
        })
})
