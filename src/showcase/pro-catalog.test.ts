// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { describe, expect, it } from 'vitest'
import { resources } from '@/lib/i18n/resources'
import { CAPABILITY_CATALOG } from './capability-catalog'
import { PRO_CATALOG, PRO_UPGRADE_URL } from './pro-catalog'

const resolve = (lang: 'en' | 'zh', key: string): unknown => {
  const [namespace, path] = key.split(':')
  let current: unknown = resources[lang][namespace as keyof (typeof resources)['en']]
  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null) return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

describe('PRO_CATALOG', () => {
  it('lists the nine Pro capabilities with unique ids that never collide with live demos', () => {
    const ids = PRO_CATALOG.map((capability) => capability.id)
    expect(ids).toHaveLength(9)
    expect(new Set(ids).size).toBe(ids.length)
    const liveIds = new Set(CAPABILITY_CATALOG.map((capability) => capability.id))
    expect(ids.filter((id) => liveIds.has(id))).toEqual([])
  })

  it('resolves every label and summary in each locale', () => {
    for (const lang of ['en', 'zh'] as const) {
      for (const capability of PRO_CATALOG) {
        expect(resolve(lang, capability.labelKey), `${lang} ${capability.labelKey}`).toEqual(expect.any(String))
        expect(resolve(lang, capability.summaryKey), `${lang} ${capability.summaryKey}`).toEqual(expect.any(String))
      }
    }
  })

  it('links to the Pro page with the GitHub campaign parameters', () => {
    const url = new URL(PRO_UPGRADE_URL)
    expect(url.protocol).toBe('https:')
    expect(url.host).toBe('soarstarter.com')
    expect(url.pathname).toBe('/tauri')
    expect(url.searchParams.get('utm_source')).toBe('github')
    expect(url.searchParams.get('utm_campaign')).toBe('tauri-lite')
  })
})
