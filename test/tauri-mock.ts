import { mockIPC, clearMocks } from '@tauri-apps/api/mocks'

/**
 * Command handler map: command name -> handler receiving the invoke args.
 * Return value (or resolved promise) is what `invoke(cmd, args)` resolves to.
 */
export type CommandHandlers = Record<string, (args: Record<string, unknown>) => unknown>

/**
 * Install mock handlers for Tauri `invoke()` calls so components/services that
 * talk to Rust commands can be unit-tested without a running Tauri shell.
 *
 * Call `clearTauriMocks()` in an `afterEach` to reset between tests.
 */
export function mockTauriCommands(handlers: CommandHandlers): void {
  mockIPC((cmd, payload) => {
    const handler = handlers[cmd]
    if (!handler) {
      throw new Error(`No mock registered for Tauri command: ${cmd}`)
    }
    return handler((payload ?? {}) as Record<string, unknown>)
  })
}

export function clearTauriMocks(): void {
  clearMocks()
}
