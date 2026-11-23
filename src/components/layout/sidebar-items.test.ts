import { afterEach, describe, expect, it, vi } from 'vitest'

const loadSidebarGroups = async ({ showcaseEnabled = true }: { showcaseEnabled?: boolean } = {}) => {
  vi.resetModules()
  vi.doMock('@/shared/config', () => ({
    showcaseConfig: { enabled: showcaseEnabled },
  }))

  return import('./sidebar-items')
}

afterEach(() => {
  vi.doUnmock('@/shared/config')
  vi.resetModules()
})

describe('SIDEBAR_GROUPS', () => {
  it('separates workspace, template, and application navigation', async () => {
    const { SIDEBAR_GROUPS } = await loadSidebarGroups()

    expect(SIDEBAR_GROUPS.map((group) => group.id)).toEqual(['workspace', 'template', 'application'])
    expect(SIDEBAR_GROUPS.find((group) => group.id === 'workspace')?.items.map((item) => item.id)).toEqual(['home'])
    expect(SIDEBAR_GROUPS.find((group) => group.id === 'template')?.items.map((item) => item.id)).toEqual([
      'showcase',
      'components',
    ])
    expect(SIDEBAR_GROUPS.find((group) => group.id === 'application')?.items.map((item) => item.id)).toEqual([
      'logs',
      'help',
      'settings',
      'about',
    ])
  })

  it('removes the template zone when showcase is disabled', async () => {
    const { SIDEBAR_GROUPS } = await loadSidebarGroups({ showcaseEnabled: false })

    expect(SIDEBAR_GROUPS.map((group) => group.id)).toEqual(['workspace', 'application'])
    expect(SIDEBAR_GROUPS.some((group) => group.id === 'template')).toBe(false)
  })
})
