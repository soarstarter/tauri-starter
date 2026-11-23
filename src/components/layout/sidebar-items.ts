import { Blocks, HelpCircle, Home, Info, ScrollText, Settings, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { showcaseConfig } from '@/shared/config'

export interface SidebarItem {
  id: string
  to: string
  /** i18n key in the `common` namespace, e.g. `nav.home`. */
  labelKey: string
  icon: LucideIcon
}

export interface SidebarGroup {
  id: 'workspace' | 'template' | 'application'
  /** i18n key in the `common` namespace, e.g. `nav.workspace`. */
  labelKey: string
  items: SidebarItem[]
}

export const SIDEBAR_GROUPS: readonly SidebarGroup[] = [
  {
    id: 'workspace',
    labelKey: 'nav.workspace',
    items: [{ id: 'home', to: '/home', labelKey: 'nav.home', icon: Home }],
  },
  // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
  ...(showcaseConfig.enabled
    ? [
        {
          id: 'template',
          labelKey: 'nav.template',
          items: [
            { id: 'showcase', to: '/showcase', labelKey: 'nav.showcase', icon: SlidersHorizontal },
            { id: 'components', to: '/showcase/components', labelKey: 'nav.components', icon: Blocks },
          ],
        } satisfies SidebarGroup,
      ]
    : []),
  {
    id: 'application',
    labelKey: 'nav.application',
    items: [
      { id: 'logs', to: '/logs', labelKey: 'nav.logs', icon: ScrollText },
      { id: 'help', to: '/help', labelKey: 'nav.help', icon: HelpCircle },
      { id: 'settings', to: '/settings', labelKey: 'nav.settings', icon: Settings },
      { id: 'about', to: '/about', labelKey: 'nav.about', icon: Info },
    ],
  },
]
