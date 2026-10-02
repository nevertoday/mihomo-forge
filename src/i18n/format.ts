import { fill } from '@/core/naming'
import type { Locale, MessageParams } from '@/types'

/** A plural message selects its form with `Intl.PluralRules` on the `n` parameter. */
export interface PluralMessage {
  zero?: string
  one?: string
  two?: string
  few?: string
  many?: string
  other: string
}

export type Message = string | PluralMessage

/** Same shape as the source catalog, with every leaf allowed to be a plain or plural message. */
export type MessageTree<T> = { [K in keyof T]: T[K] extends string ? Message : MessageTree<T[K]> }

/** Dotted keys of every leaf, e.g. `nav.overview`. */
export type MessageKey<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : MessageKey<T[K], `${P}${K}.`>
}[keyof T & string]

const pluralRules = new Map<Locale, Intl.PluralRules>()

function lookup(tree: unknown, key: string): Message | undefined {
  let node: unknown = tree
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined
    node = (node as Record<string, unknown>)[part]
  }
  if (typeof node === 'string') return node
  if (node && typeof node === 'object' && typeof (node as PluralMessage).other === 'string') return node as PluralMessage
  return undefined
}

export function hasMessage(tree: unknown, key: string): boolean {
  return lookup(tree, key) !== undefined
}

/** Resolve `key` in `tree`, falling back to `fallback` and finally to the key itself. */
export function translate(
  locale: Locale,
  tree: unknown,
  fallback: unknown,
  key: string,
  params: MessageParams = {},
): string {
  const msg = lookup(tree, key) ?? lookup(fallback, key)
  if (msg === undefined) return key
  if (typeof msg === 'string') return fill(msg, params)
  let rules = pluralRules.get(locale)
  if (!rules) pluralRules.set(locale, (rules = new Intl.PluralRules(locale)))
  const form = rules.select(Number(params.n ?? 0)) as keyof PluralMessage
  return fill(msg[form] ?? msg.other, params)
}
