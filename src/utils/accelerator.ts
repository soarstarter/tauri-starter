export interface ParsedAccelerator {
  meta: boolean
  ctrl: boolean
  alt: boolean
  shift: boolean
  key: string
}

// Map Electron's "named keys" to KeyboardEvent.key values we can compare against.
// We rely on event.key for character keys (which respects layout) and `.code`
// only as a fallback for the non-printable named keys below.
const NAMED_KEY_TO_EVENT_KEY: Record<string, string> = {
  return: 'enter',
  esc: 'escape',
  space: ' ',
  plus: '+',
  comma: ',',
}

// Tauri's global-shortcut format spells the cross-platform modifier
// `CommandOrControl` (Electron's `CmdOrCtrl` is accepted too). It means Cmd on
// macOS and Ctrl everywhere else.
const CROSS_PLATFORM_MODIFIERS = new Set(['commandorcontrol', 'cmdorctrl', 'commandorctrl', 'cmdorcontrol'])

/** Best-effort macOS check for the webview, used when the caller does not pass a platform. */
export const isMacPlatform = (): boolean =>
  typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent || navigator.platform || '')

const MODIFIERS: Record<string, keyof Omit<ParsedAccelerator, 'key'>> = {
  cmd: 'meta',
  command: 'meta',
  meta: 'meta',
  super: 'meta',
  ctrl: 'ctrl',
  control: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
}

export const parseAccelerator = (accelerator: string, isMac = isMacPlatform()): ParsedAccelerator => {
  const parsed: ParsedAccelerator = { meta: false, ctrl: false, alt: false, shift: false, key: '' }
  for (const part of accelerator.split('+')) {
    const token = part.trim().toLowerCase()
    if (!token) continue
    if (CROSS_PLATFORM_MODIFIERS.has(token)) {
      parsed[isMac ? 'meta' : 'ctrl'] = true
      continue
    }
    const modifier = MODIFIERS[token]
    if (modifier) {
      parsed[modifier] = true
      continue
    }
    parsed.key = NAMED_KEY_TO_EVENT_KEY[token] ?? token
  }
  return parsed
}

export const matchesAccelerator = (event: KeyboardEvent, parsed: ParsedAccelerator): boolean => {
  if (event.metaKey !== parsed.meta) return false
  if (event.ctrlKey !== parsed.ctrl) return false
  if (event.altKey !== parsed.alt) return false
  if (event.shiftKey !== parsed.shift) return false
  return event.key.toLowerCase() === parsed.key
}

const MAC_SYMBOLS: Record<keyof Omit<ParsedAccelerator, 'key'>, string> = {
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧',
  meta: '⌘',
}

const OTHER_LABELS: Record<keyof Omit<ParsedAccelerator, 'key'>, string> = {
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  meta: 'Super',
}

const KEY_LABELS: Record<string, string> = {
  ' ': 'Space',
  enter: 'Enter',
  escape: 'Esc',
}

/**
 * Human-readable form of an accelerator for the current platform: `⌘K` on
 * macOS, `Ctrl+K` elsewhere. Resolves `CommandOrControl` the same way
 * {@link parseAccelerator} does, so what the UI shows is what the key handler
 * matches.
 */
export const formatAcceleratorForDisplay = (accelerator: string, isMac = isMacPlatform()): string => {
  const parsed = parseAccelerator(accelerator, isMac)
  const order: (keyof Omit<ParsedAccelerator, 'key'>)[] = ['ctrl', 'alt', 'shift', 'meta']
  const modifiers = order.filter((modifier) => parsed[modifier])
  const key = KEY_LABELS[parsed.key] ?? parsed.key.toUpperCase()
  if (isMac) return [...modifiers.map((modifier) => MAC_SYMBOLS[modifier]), key].join('')
  return [...modifiers.map((modifier) => OTHER_LABELS[modifier]), key].join('+')
}
