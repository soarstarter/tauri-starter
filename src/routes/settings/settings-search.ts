// Searchable index of individual settings, so a user can find a control by name
// without knowing which tab it lives on. Entries reference i18n keys in the
// `settings` namespace; the search itself matches against the *translated*
// label/description (plus a few extra keywords) so it works in every locale.

export interface SettingsSearchEntry {
  /** Stable id (also the result key). */
  id: string
  /** Tab the control lives on; selecting a result switches to it. */
  tabId: string
  labelKey: string
  descriptionKey?: string
  /** Locale-independent extra terms (kept lowercase). */
  keywords?: string[]
}

export interface SettingsSearchResult {
  entry: SettingsSearchEntry
  label: string
  tabLabel: string
}

export const SETTINGS_SEARCH_INDEX: SettingsSearchEntry[] = [
  {
    id: 'language',
    tabId: 'general',
    labelKey: 'general.language.label',
    descriptionKey: 'general.language.description',
    keywords: ['locale', 'english', 'chinese'],
  },
  {
    id: 'launchAtLogin',
    tabId: 'general',
    labelKey: 'general.launchAtLogin.label',
    descriptionKey: 'general.launchAtLogin.description',
    keywords: ['startup', 'autostart'],
  },
  {
    id: 'minimizeToTray',
    tabId: 'general',
    labelKey: 'general.minimizeToTray.label',
    descriptionKey: 'general.minimizeToTray.description',
    keywords: ['tray', 'close'],
  },
  {
    id: 'theme',
    tabId: 'appearance',
    labelKey: 'appearance.theme.label',
    descriptionKey: 'appearance.theme.description',
    keywords: ['dark', 'light', 'appearance'],
  },
  {
    id: 'accent',
    tabId: 'appearance',
    labelKey: 'appearance.accent.label',
    descriptionKey: 'appearance.accent.description',
    keywords: ['color', 'tint', 'primary'],
  },
  {
    id: 'notifications',
    tabId: 'notifications',
    labelKey: 'notifications.enabled.label',
    descriptionKey: 'notifications.enabled.description',
    keywords: ['alerts', 'toast'],
  },
  {
    id: 'shortcuts',
    tabId: 'shortcuts',
    labelKey: 'shortcuts.title',
    descriptionKey: 'shortcuts.description',
    keywords: ['keyboard', 'accelerator', 'hotkey'],
  },
  {
    id: 'proxyMode',
    tabId: 'proxy',
    labelKey: 'proxy.mode.label',
    descriptionKey: 'proxy.mode.description',
    keywords: ['network', 'proxy'],
  },
  {
    id: 'proxyUrl',
    tabId: 'proxy',
    labelKey: 'proxy.url.label',
    descriptionKey: 'proxy.url.description',
    keywords: ['network', 'proxy', 'url'],
  },
  {
    id: 'dataDir',
    tabId: 'storage',
    labelKey: 'storage.dataDir.label',
    descriptionKey: 'storage.dataDir.description',
    keywords: ['directory', 'location', 'path'],
  },
  {
    id: 'backup',
    tabId: 'storage',
    labelKey: 'storage.backup.label',
    descriptionKey: 'storage.backup.description',
    keywords: ['export', 'import', 'restore'],
  },
  {
    id: 'reset',
    tabId: 'advanced',
    labelKey: 'advanced.reset.label',
    descriptionKey: 'advanced.reset.description',
    keywords: ['defaults', 'restore'],
  },
]

const MAX_RESULTS = 8

/**
 * Filter the settings index by a free-text query. An entry matches when every
 * whitespace-separated token appears in its translated label, description,
 * keywords, or tab name (all case-insensitive). Hidden tabs (per the injected
 * `isTabVisible`) are excluded so search never points at a stripped subsystem.
 */
export const searchSettings = (
  query: string,
  translate: (key: string) => string,
  isTabVisible: (tabId: string) => boolean,
  index: SettingsSearchEntry[] = SETTINGS_SEARCH_INDEX
): SettingsSearchResult[] => {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return []

  const results: SettingsSearchResult[] = []
  for (const entry of index) {
    if (!isTabVisible(entry.tabId)) continue

    const label = translate(entry.labelKey)
    const description = entry.descriptionKey ? translate(entry.descriptionKey) : ''
    const tabLabel = translate(`tabs.${entry.tabId}`)
    const haystack = [label, description, tabLabel, ...(entry.keywords ?? [])].join(' ').toLowerCase()

    if (tokens.every((token) => haystack.includes(token))) {
      results.push({ entry, label, tabLabel })
      if (results.length >= MAX_RESULTS) break
    }
  }
  return results
}
