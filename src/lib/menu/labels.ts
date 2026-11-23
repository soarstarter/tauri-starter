import i18n from '@/lib/i18n'

// Menu/tray label indirection. The JS-built native menu and tray can be rebuilt
// on language change while keeping all user-facing strings in the same i18next
// resources as the renderer. English defaults stay here so menu construction is
// still useful if i18n has not finished booting.

export const MENU_LABELS = {
  // Application-menu top-level titles
  'menu.file': 'File',
  'menu.edit': 'Edit',
  'menu.view': 'View',
  'menu.window': 'Window',
  'menu.help': 'Help',
  // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
  'menu.template': 'Template',
  'menu.openShowcase': 'Open Showcase',
  'menu.openFileDemo': 'Open File Demo',
  // View
  'menu.actualSize': 'Actual Size',
  'menu.zoomIn': 'Zoom In',
  'menu.zoomOut': 'Zoom Out',
  // Help
  'menu.showLogs': 'Show Logs',
  'menu.about': 'About',
  'menu.homepage': 'Homepage',
  // Tray
  'tray.openMainWindow': 'Open Main Window',
  'tray.settings': 'Settings',
  'tray.about': 'About',
  'tray.quit': 'Quit',
} as const

export type MenuLabelKey = keyof typeof MENU_LABELS

/** Resolve a menu/tray label through i18next, falling back to English defaults. */
export const menuLabel = (key: MenuLabelKey): string =>
  i18n.t(`common:${key}`, {
    defaultValue: MENU_LABELS[key],
  })
