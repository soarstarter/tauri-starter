import { describe, expect, it } from 'vitest'
import { tauri } from '@/lib/tauri'
import { useTauri } from './use-tauri'

describe('useTauri', () => {
  it('returns the whole surface when called with no key', () => {
    expect(useTauri()).toBe(tauri)
  })

  it('returns the keyed domain', () => {
    expect(useTauri('app')).toBe(tauri.app)
  })
})
