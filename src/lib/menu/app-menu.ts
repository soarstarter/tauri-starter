import { Menu, type MenuOptions } from '@tauri-apps/api/menu'
import { features } from '@/shared/config'
import { APP_NAME, HOMEPAGE_URL } from '@/shared/constants'
import { appIntents, type NavigationRoute } from '@/lib/intents'
import { openExternalUrl } from '@/lib/tauri/external-url'
import { windowApi } from '@/lib/tauri/window'
import { menuLabel } from './labels'

// The native application menu, built from a TS definition with
// `@tauri-apps/api/menu` (Phase 3.5) — the Tauri port of the Electron template's
// `menu.ts`. Building it in JS (rather than Rust) means the labels reuse the
// same string layer as the rest of the UI, so Phase 5.2 can rebuild the menu on
// language change by re-invoking `installAppMenu`.
//
// Menu actions never touch window references directly: navigation goes through
// the same `appIntents` dispatcher as deep links and the tray, so there is one
// path into the router.

type MenuItems = NonNullable<MenuOptions['items']>
type MenuItemDef = MenuItems[number]

const navigate = (route: NavigationRoute) => () => appIntents.dispatch({ type: 'navigate', route })

const openHomepage = () => {
  openExternalUrl(HOMEPAGE_URL).catch((error) => {
    console.error('Rejected external URL:', error)
  })
}

const separator: MenuItemDef = { item: 'Separator' }

/** Build the ordered list of top-level submenus for the given platform. */
const buildMenuItems = (isMac: boolean): MenuItems => {
  const fileSubmenu: MenuItemDef = {
    text: menuLabel('menu.file'),
    items: [isMac ? { item: 'CloseWindow' } : { item: 'Quit' }],
  }

  // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
  const templateSubmenu: MenuItemDef | undefined = features.showcase
    ? {
        text: menuLabel('menu.template'),
        items: [
          { text: menuLabel('menu.openShowcase'), action: navigate('/showcase') },
          { text: menuLabel('menu.openFileDemo'), action: navigate('/showcase/file') },
        ],
      }
    : undefined

  const editSubmenu: MenuItemDef = {
    text: menuLabel('menu.edit'),
    items: [
      { item: 'Undo' },
      { item: 'Redo' },
      separator,
      { item: 'Cut' },
      { item: 'Copy' },
      { item: 'Paste' },
      { item: 'SelectAll' },
    ],
  }

  const viewSubmenu: MenuItemDef = {
    text: menuLabel('menu.view'),
    items: [
      { text: menuLabel('menu.actualSize'), accelerator: 'CmdOrCtrl+0', action: () => void windowApi.resetZoom() },
      { text: menuLabel('menu.zoomIn'), accelerator: 'CmdOrCtrl+Plus', action: () => void windowApi.zoomIn() },
      { text: menuLabel('menu.zoomOut'), accelerator: 'CmdOrCtrl+-', action: () => void windowApi.zoomOut() },
      separator,
      { item: 'Fullscreen' },
    ],
  }

  const windowSubmenu: MenuItemDef = {
    text: menuLabel('menu.window'),
    items: isMac
      ? [{ item: 'Minimize' }, { item: 'Maximize' }, separator, { item: 'BringAllToFront' }]
      : [{ item: 'Minimize' }, { item: 'CloseWindow' }],
  }

  const helpSubmenu: MenuItemDef = {
    text: menuLabel('menu.help'),
    items: [
      { text: menuLabel('menu.showLogs'), action: navigate('/logs') },
      separator,
      { text: menuLabel('menu.about'), action: navigate('/about') },
      separator,
      { text: menuLabel('menu.homepage'), action: openHomepage },
    ],
  }

  const appSubmenu: MenuItemDef = {
    text: APP_NAME,
    items: [
      { item: { About: null } },
      separator,
      { item: 'Services' },
      separator,
      { item: 'Hide' },
      { item: 'HideOthers' },
      { item: 'ShowAll' },
      separator,
      { item: 'Quit' },
    ],
  }

  return [
    ...(isMac ? [appSubmenu] : []),
    fileSubmenu,
    ...(templateSubmenu ? [templateSubmenu] : []),
    editSubmenu,
    viewSubmenu,
    windowSubmenu,
    helpSubmenu,
  ]
}

/**
 * Build and install the application menu. Call once at boot; call again after a
 * language change (Phase 5.2) to rebuild with translated labels. Swallows
 * failures (e.g. running outside a Tauri host) so boot never hard-fails on menu
 * setup.
 */
export async function installAppMenu(platform: string): Promise<void> {
  try {
    const menu = await Menu.new({ items: buildMenuItems(platform === 'macos') })
    await menu.setAsAppMenu()
  } catch (error) {
    console.error('Failed to install application menu:', error)
  }
}
