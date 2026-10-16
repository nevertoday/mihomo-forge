import { describe, expect, it } from 'vitest'
import { plain } from '@/utils/plain'

describe('plain', () => {
  it('drops the leading mark of a group name', () => {
    expect(plain('🇺🇸 美国自动')).toBe('美国自动')
    expect(plain('🛡️ 故障转移')).toBe('故障转移')
    expect(plain('𝕏 Grok')).toBe('Grok')
    expect(plain('📦 机场A 自动')).toBe('机场A 自动')
  })
  it('keeps names that start with a word', () => {
    expect(plain('DIRECT')).toBe('DIRECT')
    expect(plain('IEPL 专线')).toBe('IEPL 专线')
    expect(plain('1 号机场 自动')).toBe('1 号机场 自动')
    expect(plain(undefined)).toBe('')
  })
})
