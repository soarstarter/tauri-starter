// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { describe, expect, it } from 'vitest'
import { resources } from '@/lib/i18n/resources'
import { CAPABILITY_CATALOG, capabilitiesIn, capabilityForRoute } from './capability-catalog'

const resolveEnString = (key: string): string | undefined => {
  const [namespace, path] = key.split(':')
  if (!namespace || !path) return undefined

  let current: unknown = resources.en[namespace as keyof typeof resources.en]
  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null || !(segment in current)) return undefined
    current = (current as Record<string, unknown>)[segment]
  }

  return typeof current === 'string' ? current : undefined
}

describe('CAPABILITY_CATALOG', () => {
  it('has unique stable ids', () => {
    const ids = CAPABILITY_CATALOG.map((capability) => capability.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('uses showcase-prefixed demo routes', () => {
    for (const capability of CAPABILITY_CATALOG) {
      if (capability.route) {
        expect(capability.route).toMatch(/^\/showcase\//)
      }
    }
  })

  it('keeps routed capabilities addressable by route', () => {
    for (const capability of CAPABILITY_CATALOG) {
      if (capability.route) {
        expect(capabilityForRoute(capability.route)?.id).toBe(capability.id)
      }
    }
  })

  it('groups capabilities by category without inventing entries', () => {
    expect(capabilitiesIn('shell').map((capability) => capability.id)).toEqual(
      CAPABILITY_CATALOG.filter((capability) => capability.category === 'shell').map((capability) => capability.id)
    )
  })

  it('resolves every English label and summary key', () => {
    for (const capability of CAPABILITY_CATALOG) {
      expect(resolveEnString(capability.labelKey), capability.labelKey).toBeTruthy()
      expect(resolveEnString(capability.summaryKey), capability.summaryKey).toBeTruthy()
    }
  })
})
