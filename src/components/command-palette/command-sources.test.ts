import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildCommandActions,
  clearCommandSources,
  recentFilesSource,
  registerCommandSource,
  routesSource,
  settingsSource,
  showcaseSource,
  topActions,
  type CommandAction,
  type CommandBuildContext,
} from './command-sources'

const makeCtx = (overrides: Partial<CommandBuildContext> = {}): CommandBuildContext => ({
  t: (key: string) => key, // echo the key so assertions can match
  navigate: vi.fn(),
  openRecentFile: vi.fn(),
  isTabVisible: () => true,
  recentFiles: [],
  showcaseEnabled: true,
  ...overrides,
})

afterEach(() => {
  clearCommandSources()
})

describe('routesSource', () => {
  it('navigates on perform', () => {
    const ctx = makeCtx()
    const actions = routesSource(ctx)

    expect(actions.find((a) => a.id === 'route:files')).toBeUndefined()
    expect(actions.find((a) => a.id === 'route:todos')).toBeUndefined()
    const home = actions.find((a) => a.id === 'route:home')!
    home.perform()
    expect(ctx.navigate).toHaveBeenCalledWith('/home')
  })
})

describe('showcaseSource', () => {
  it('maps routed capabilities to showcase actions', () => {
    const ctx = makeCtx()
    const actions = showcaseSource(ctx)
    const fileDemo = actions.find((a) => a.id === 'showcase:file-dialogs')!

    expect(fileDemo.title).toBe('showcase:catalog.file-dialogs.title')
    expect(fileDemo.group).toBe('showcase')
    fileDemo.perform()
    expect(ctx.navigate).toHaveBeenCalledWith('/showcase/file')
  })

  it('returns no actions when showcase is disabled', () => {
    const actions = showcaseSource(makeCtx({ showcaseEnabled: false }))

    expect(actions).toHaveLength(0)
  })
})

describe('settingsSource', () => {
  it('deep-links to the owning tab', () => {
    const ctx = makeCtx()
    const accent = settingsSource(ctx).find((a) => a.id === 'setting:accent')!
    accent.perform()
    expect(ctx.navigate).toHaveBeenCalledWith('/settings?tab=appearance')
  })

  it('drops entries on a hidden tab', () => {
    const ctx = makeCtx({ isTabVisible: (tabId) => tabId !== 'proxy' })
    const actions = settingsSource(ctx)
    expect(actions.find((a) => a.id === 'setting:proxyMode')).toBeUndefined()
    expect(actions.find((a) => a.id === 'setting:theme')).toBeDefined()
  })
})

describe('recentFilesSource', () => {
  it('maps recent paths to basename titles and opens on perform', () => {
    const ctx = makeCtx({ recentFiles: ['/docs/report.txt', '/notes/todo.md'] })
    const actions = recentFilesSource(ctx)

    expect(actions.map((a) => a.title)).toEqual(['report.txt', 'todo.md'])
    actions[0].perform()
    expect(ctx.openRecentFile).toHaveBeenCalledWith('/docs/report.txt')
  })
})

describe('buildCommandActions', () => {
  it('includes built-in sources', () => {
    const actions = buildCommandActions(makeCtx())
    expect(actions.some((a) => a.id === 'route:home')).toBe(true)
    expect(actions.some((a) => a.id.startsWith('showcase:'))).toBe(true)
    expect(actions.some((a) => a.id.startsWith('setting:'))).toBe(true)
  })

  it('omits showcase actions when showcase is disabled', () => {
    const actions = buildCommandActions(makeCtx({ showcaseEnabled: false }))

    expect(actions.filter((a) => a.id.startsWith('showcase:'))).toHaveLength(0)
  })

  it('appends registered sources and unregisters cleanly', () => {
    const custom: CommandAction = {
      id: 'custom:hello',
      title: 'Hello',
      group: 'navigation',
      perform: vi.fn(),
    }
    const unregister = registerCommandSource(() => [custom])

    expect(buildCommandActions(makeCtx()).some((a) => a.id === 'custom:hello')).toBe(true)
    unregister()
    expect(buildCommandActions(makeCtx()).some((a) => a.id === 'custom:hello')).toBe(false)
  })

  it('isolates a throwing source instead of failing the whole list', () => {
    registerCommandSource(() => {
      throw new Error('boom')
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const actions = buildCommandActions(makeCtx())
    expect(actions.some((a) => a.id === 'route:home')).toBe(true)
  })
})

describe('topActions', () => {
  it('returns the highest-priority actions, capped', () => {
    const actions: CommandAction[] = [
      { id: 'a', title: 'a', group: 'navigation', priority: 1, perform: vi.fn() },
      { id: 'b', title: 'b', group: 'navigation', priority: 9, perform: vi.fn() },
      { id: 'c', title: 'c', group: 'navigation', priority: 5, perform: vi.fn() },
    ]
    expect(topActions(actions, 2).map((a) => a.id)).toEqual(['b', 'c'])
  })
})
