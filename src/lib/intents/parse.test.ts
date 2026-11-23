import { describe, expect, it } from 'vitest'
import { parseArgvForIntents, parseDeepLinkUrl, parseDeepLinkUrls } from './parse'

describe('parseArgvForIntents', () => {
  it('parses --route= flags into validated navigate intents', () => {
    const intents = parseArgvForIntents(['/path/to/app', '.', '--route=/settings'])
    expect(intents).toEqual([{ type: 'navigate', route: '/settings' }])
  })

  it('preserves the order of multiple intent flags', () => {
    const intents = parseArgvForIntents(['--route=/about', '--route=/home'])
    expect(intents).toEqual([
      { type: 'navigate', route: '/about' },
      { type: 'navigate', route: '/home' },
    ])
  })

  it.each([
    ['--route=/admin'],
    ['--route=https://example.com'],
    ['--route='],
    ['--ROUTE=/settings'],
    ['route=/settings'],
  ])('rejects unsupported or malformed argv entry %s', (entry) => {
    expect(parseArgvForIntents([entry])).toEqual([])
  })

  it('ignores unrelated arguments', () => {
    expect(parseArgvForIntents(['/path/to/app', '.', '--inspect=5858', 'unrelated'])).toEqual([])
  })

  it.each([
    ['tauri-starter://settings', '/settings'],
    ['tauri-starter://about', '/about'],
    ['tauri-starter://home', '/home'],
    // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
    ['tauri-starter://showcase', '/showcase'],
    ['tauri-starter://showcase/components', '/showcase/components'],
    ['tauri-starter://showcase/file', '/showcase/file'],
    ['tauri-starter:///settings', '/settings'],
    ['tauri-starter://settings/', '/settings'],
    ['tauri-starter://settings?ref=launchpad', '/settings'],
    ['tauri-starter://settings#section', '/settings'],
  ])('parses %s into a validated navigate intent', (entry, expectedRoute) => {
    expect(parseArgvForIntents([entry])).toEqual([{ type: 'navigate', route: expectedRoute }])
  })

  it.each([
    ['tauri-starter://'],
    ['tauri-starter://unknown'],
    ['tauri-starter://settings/extra'],
    ['TAURI-STARTER://settings'],
    ['other://settings'],
  ])('rejects malformed or unsupported protocol url %s', (entry) => {
    expect(parseArgvForIntents([entry])).toEqual([])
  })

  it('mixes --route and tauri-starter:// argv entries while preserving order', () => {
    expect(parseArgvForIntents(['--route=/home', 'tauri-starter://about', '--route=/settings'])).toEqual([
      { type: 'navigate', route: '/home' },
      { type: 'navigate', route: '/about' },
      { type: 'navigate', route: '/settings' },
    ])
  })
})

describe('parseDeepLinkUrl', () => {
  it('parses a whitelisted deep link into a navigate intent', () => {
    expect(parseDeepLinkUrl('tauri-starter://settings?ref=x')).toEqual({ type: 'navigate', route: '/settings' })
  })

  it.each([
    ['tauri-starter://unknown'],
    ['tauri-starter://settings/extra'],
    ['https://example.com'],
    ['--route=/settings'],
  ])('returns null for non-whitelisted or non-protocol url %s', (url) => {
    expect(parseDeepLinkUrl(url)).toBeNull()
  })
})

describe('parseDeepLinkUrls', () => {
  it('parses a batch, dropping invalid entries and preserving order', () => {
    expect(parseDeepLinkUrls(['tauri-starter://home', 'tauri-starter://unknown', 'tauri-starter://about'])).toEqual([
      { type: 'navigate', route: '/home' },
      { type: 'navigate', route: '/about' },
    ])
  })
})
