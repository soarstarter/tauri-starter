import { commands, type Result } from '@/lib/bindings'

function unwrap<T>(result: Result<T, string>): T {
  if (result.status === 'error') throw new Error(result.error)
  return result.data
}

export const logsApi = {
  path: async () => unwrap(await commands.logFilePath()),
  tail: async (lines = 200) => unwrap(await commands.logTail(lines)),
  openFolder: async () => unwrap(await commands.openLogFolder()),
}

export type LogsApi = typeof logsApi
