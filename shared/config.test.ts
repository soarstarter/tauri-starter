import { describe, expect, it } from 'vitest'
import { features, readFlag, readString, showcaseConfig } from './config'

describe('readFlag', () => {
  it('treats true / "true" / "1" as on', () => {
    expect(readFlag({ FLAG: true }, 'FLAG', false)).toBe(true)
    expect(readFlag({ FLAG: 'true' }, 'FLAG', false)).toBe(true)
    expect(readFlag({ FLAG: '1' }, 'FLAG', false)).toBe(true)
  })

  it('treats false / "false" / "0" as off', () => {
    expect(readFlag({ FLAG: false }, 'FLAG', true)).toBe(false)
    expect(readFlag({ FLAG: 'false' }, 'FLAG', true)).toBe(false)
    expect(readFlag({ FLAG: '0' }, 'FLAG', true)).toBe(false)
  })

  it('falls back when the value is unset', () => {
    expect(readFlag({}, 'FLAG', true)).toBe(true)
    expect(readFlag({}, 'FLAG', false)).toBe(false)
    expect(readFlag(undefined, 'FLAG', true)).toBe(true)
  })

  it('falls back when the value is unrecognized (never silently flips)', () => {
    expect(readFlag({ FLAG: 'yes' }, 'FLAG', true)).toBe(true)
    expect(readFlag({ FLAG: 'yes' }, 'FLAG', false)).toBe(false)
    expect(readFlag({ FLAG: '' }, 'FLAG', true)).toBe(true)
  })
})

describe('readString', () => {
  it('returns a non-empty string value as-is', () => {
    expect(readString({ KEY: 'https://collect.example.com' }, 'KEY')).toBe('https://collect.example.com')
  })

  it('returns "" for unset, blank, or non-string values', () => {
    expect(readString({}, 'KEY')).toBe('')
    expect(readString(undefined, 'KEY')).toBe('')
    expect(readString({ KEY: '   ' }, 'KEY')).toBe('')
    expect(readString({ KEY: 123 }, 'KEY')).toBe('')
  })
})

describe('showcaseConfig', () => {
  it('mirrors the showcase feature flag', () => {
    expect(showcaseConfig.enabled).toBe(features.showcase)
  })

  it('uses VITE_SHOWCASE_ENABLED flag semantics with a default-on fallback', () => {
    expect(readFlag({}, 'VITE_SHOWCASE_ENABLED', true)).toBe(true)
    expect(readFlag({ VITE_SHOWCASE_ENABLED: 'false' }, 'VITE_SHOWCASE_ENABLED', true)).toBe(false)
    expect(readFlag({ VITE_SHOWCASE_ENABLED: 'true' }, 'VITE_SHOWCASE_ENABLED', false)).toBe(true)
  })
})
