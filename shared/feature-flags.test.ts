import { describe, expect, it } from 'vitest'
import { features } from './config'
import { getNativeFeatureFlags } from './feature-flags'

describe('getNativeFeatureFlags', () => {
  it('projects only the flags the Rust side needs', () => {
    expect(Object.keys(getNativeFeatureFlags())).toEqual(['showcase'])
  })

  it('mirrors the showcase flag from the single TS source of truth', () => {
    expect(getNativeFeatureFlags().showcase).toBe(features.showcase)
  })
})
