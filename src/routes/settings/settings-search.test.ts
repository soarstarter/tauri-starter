import { describe, expect, it } from 'vitest'
import { searchSettings, SETTINGS_SEARCH_INDEX } from './settings-search'

// Minimal translator: echoes the last path segment so matching can be asserted
// without loading the full i18n bundle. Tab labels echo the tab id.
const translate = (key: string): string => {
  if (key.startsWith('tabs.')) return key.slice('tabs.'.length)
  const segments = key.split('.')
  // e.g. appearance.accent.label -> "accent"
  return segments[segments.length - 2] ?? key
}

const allVisible = () => true

describe('searchSettings', () => {
  it('returns nothing for an empty query', () => {
    expect(searchSettings('', translate, allVisible)).toEqual([])
    expect(searchSettings('   ', translate, allVisible)).toEqual([])
  })

  it('matches against the translated label', () => {
    const results = searchSettings('accent', translate, allVisible)
    expect(results.map((r) => r.entry.id)).toContain('accent')
  })

  it('matches against locale-independent keywords', () => {
    // "export" only appears in the backup entry keywords, not its label segment.
    const results = searchSettings('export', translate, allVisible)
    expect(results.map((r) => r.entry.id)).toEqual(['backup'])
  })

  it('requires every token to match (AND semantics)', () => {
    const results = searchSettings('accent zzzz', translate, allVisible)
    expect(results).toEqual([])
  })

  it('is case-insensitive', () => {
    expect(searchSettings('ACCENT', translate, allVisible).map((r) => r.entry.id)).toContain('accent')
  })

  it('excludes entries whose tab is hidden', () => {
    expect(searchSettings('proxy', translate, allVisible).length).toBeGreaterThan(0)
    const isVisible = (tabId: string) => tabId !== 'proxy'
    expect(searchSettings('proxy', translate, isVisible)).toEqual([])
  })

  it('caps the number of results', () => {
    // A token shared by many entries should still be capped at the max (8).
    const broadIndex = Array.from({ length: 20 }, (_, i) => ({
      id: `e${i}`,
      tabId: 'general',
      labelKey: 'general.common.label',
    }))
    const results = searchSettings('common', () => 'common term', allVisible, broadIndex)
    expect(results.length).toBeLessThanOrEqual(8)
  })

  it('keeps the static index and tab ids consistent', () => {
    // Guard against an entry pointing at a tab id that no longer exists.
    const knownTabs = new Set(['general', 'appearance', 'notifications', 'shortcuts', 'proxy', 'storage', 'advanced'])
    for (const entry of SETTINGS_SEARCH_INDEX) {
      expect(knownTabs.has(entry.tabId)).toBe(true)
    }
  })
})
