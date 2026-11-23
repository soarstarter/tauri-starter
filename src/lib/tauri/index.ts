import { appApi } from './app'
import { diagnosticsApi } from './diagnostics'
import { fileApi } from './file'
import { logsApi } from './logs'
import { secureApi } from './secure'
import { windowApi } from './window'

/**
 * The typed native API surface, organized by domain — the Tauri successor to the
 * Electron template's `conveyor`. New domains (settings, logs, secure, file,
 * notification, shortcut) are added here as their phases land.
 */
export const tauri = {
  app: appApi,
  diagnostics: diagnosticsApi,
  file: fileApi,
  logs: logsApi,
  secure: secureApi,
  window: windowApi,
} as const

export type Tauri = typeof tauri

export * from './events'
export * from './external-url'
