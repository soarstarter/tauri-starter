import {
  Home,
  FileText,
  ScrollText,
  HelpCircle,
  Settings,
  Info,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'
import { SETTINGS_SEARCH_INDEX } from '@/routes/settings/settings-search'
// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { CAPABILITY_CATALOG } from '@/showcase/capability-catalog'

/** A single runnable entry in the command palette. */
export interface CommandAction {
  id: string
  title: string
  subtitle?: string
  /** Group bucket used for the section heading. */
  group: 'navigation' | 'settings' | 'recent' | (string & {})
  /** Extra match terms (cmdk filters on title + these). */
  keywords?: string[]
  icon?: LucideIcon
  /** Higher = more prominent in the empty-state "top actions". */
  priority?: number
  perform: () => void
}

/**
 * Everything a source needs to build its actions. Sources receive the live
 * helpers/data and return actions whose `perform` already closes over them.
 */
export interface CommandBuildContext {
  /** Translate a namespaced key, e.g. `common:nav.home` or `settings:appearance.accent.label`. */
  t: (key: string) => string
  navigate: (to: string) => void
  openRecentFile: (path: string) => void
  isTabVisible: (tabId: string) => boolean
  recentFiles: string[]
  showcaseEnabled: boolean
}

export type CommandSource = (ctx: CommandBuildContext) => CommandAction[]

const basename = (filePath: string): string => filePath.split(/[\\/]/).pop() || filePath

// Built-in: app routes.
const ROUTES: {
  id: string
  to: string
  labelKey: string
  icon: LucideIcon
  priority: number
}[] = [
  { id: 'home', to: '/home', labelKey: 'common:nav.home', icon: Home, priority: 100 },
  { id: 'settings', to: '/settings', labelKey: 'common:nav.settings', icon: Settings, priority: 95 },
  { id: 'about', to: '/about', labelKey: 'common:nav.about', icon: Info, priority: 50 },
  { id: 'logs', to: '/logs', labelKey: 'common:nav.logs', icon: ScrollText, priority: 40 },
  { id: 'help', to: '/help', labelKey: 'common:nav.help', icon: HelpCircle, priority: 35 },
]

export const routesSource: CommandSource = (ctx) =>
  ROUTES.map((route) => ({
    id: `route:${route.id}`,
    title: ctx.t(route.labelKey),
    group: 'navigation',
    keywords: [route.to.replace('/', '')],
    icon: route.icon,
    priority: route.priority,
    perform: () => ctx.navigate(route.to),
  }))

// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
export const showcaseSource: CommandSource = (ctx) => {
  if (!ctx.showcaseEnabled) return []

  return CAPABILITY_CATALOG.flatMap((capability, index) => {
    const route = capability.route
    if (!route) return []

    return [
      {
        id: `showcase:${capability.id}`,
        title: ctx.t(capability.labelKey),
        subtitle: ctx.t(capability.summaryKey),
        group: 'showcase',
        keywords: [capability.id, capability.category, route.replace('/showcase/', '')],
        icon: capability.icon,
        priority: 85 - index * 0.1,
        perform: () => ctx.navigate(route),
      },
    ]
  })
}

export const settingsSource: CommandSource = (ctx) =>
  SETTINGS_SEARCH_INDEX.filter((entry) => ctx.isTabVisible(entry.tabId)).map((entry) => ({
    id: `setting:${entry.id}`,
    title: ctx.t(`settings:${entry.labelKey}`),
    subtitle: ctx.t(`settings:tabs.${entry.tabId}`),
    group: 'settings',
    keywords: [...(entry.keywords ?? []), entry.tabId, ctx.t(`settings:tabs.${entry.tabId}`)],
    icon: SlidersHorizontal,
    priority: 10,
    // Deep-link straight to the owning tab.
    perform: () => ctx.navigate(`/settings?tab=${entry.tabId}`),
  }))

export const recentFilesSource: CommandSource = (ctx) =>
  ctx.recentFiles.map((path, index) => ({
    id: `recent:${path}`,
    title: basename(path),
    subtitle: path,
    group: 'recent',
    keywords: [path],
    icon: FileText,
    // Newest first stays slightly above the rest within the group.
    priority: 5 - index * 0.01,
    perform: () => ctx.openRecentFile(path),
  }))

export const BUILT_IN_SOURCES: readonly CommandSource[] = [
  routesSource,
  // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
  showcaseSource,
  settingsSource,
  recentFilesSource,
]

// App-code extension point. Sources registered here are appended after the
// built-ins; the returned function unregisters.
const customSources: CommandSource[] = []

export const registerCommandSource = (source: CommandSource): (() => void) => {
  customSources.push(source)
  return () => {
    const index = customSources.indexOf(source)
    if (index !== -1) customSources.splice(index, 1)
  }
}

/** For tests: drop all app-registered sources. */
export const clearCommandSources = (): void => {
  customSources.length = 0
}

/** Build the full action list from built-in + registered sources. */
export const buildCommandActions = (ctx: CommandBuildContext): CommandAction[] =>
  [...BUILT_IN_SOURCES, ...customSources].flatMap((source) => {
    try {
      return source(ctx)
    } catch (error) {
      console.error('Command source threw:', error)
      return []
    }
  })

/** Highest-priority actions for the empty-state suggestions. */
export const topActions = (actions: CommandAction[], count = 5): CommandAction[] =>
  [...actions].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)).slice(0, count)
