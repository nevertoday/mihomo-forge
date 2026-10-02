import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadSourceFromText } from '@/core/parser/loadSource'
import { createDefaultSettings } from '@/core/project/defaults'
import type { ProjectSettings, Source } from '@/types'

export function fixture(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8')
}

export async function loadFixture(name: string): Promise<Source> {
  return loadSourceFromText(fixture(name), name, { excludeInfoNodes: true })
}

/** The three-source minimal example from spec §42. */
export async function exampleSources(): Promise<Source[]> {
  return Promise.all(['奶昔.yaml', '机场A.yaml', '机场B.yaml'].map(loadFixture))
}

export function settings(patch: (s: ProjectSettings) => void = () => {}): ProjectSettings {
  const s = createDefaultSettings()
  patch(s)
  return s
}

/** Inline YAML helper: `yamlOf([{ name, type, server, port }])`. */
export function proxiesYaml(nodes: Record<string, unknown>[]): string {
  return `proxies:\n${nodes.map((n) => `  - ${JSON.stringify(n)}`).join('\n')}\n`
}

export const ss = (name: string, server: string, extra: Record<string, unknown> = {}) => ({
  name,
  type: 'ss',
  server,
  port: 8388,
  cipher: 'aes-256-gcm',
  password: 'pw',
  ...extra,
})
