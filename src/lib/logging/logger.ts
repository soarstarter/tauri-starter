import { debug, error, info, warn, type LogOptions } from '@tauri-apps/plugin-log'
import { redactContext, redactSensitive } from './log-redact'

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface LogEntryPayload {
  level: LogLevel
  message: string
  context?: Record<string, string | number | boolean>
}

const loggers = { error, warn, info, debug } satisfies Record<
  LogLevel,
  (message: string, options?: LogOptions) => Promise<void>
>

const toLogKeyValues = (context: LogEntryPayload['context']): Record<string, string | undefined> | undefined => {
  const redacted = redactContext(context)
  if (!redacted) return undefined
  return Object.fromEntries(Object.entries(redacted).map(([key, value]) => [key, String(value)]))
}

export const appLog = async ({ level, message, context }: LogEntryPayload): Promise<void> => {
  await loggers[level](redactSensitive(message), { keyValues: toLogKeyValues(context) })
}

export const rendererLogger = {
  error: (message: string, context?: LogEntryPayload['context']) => appLog({ level: 'error', message, context }),
  warn: (message: string, context?: LogEntryPayload['context']) => appLog({ level: 'warn', message, context }),
  info: (message: string, context?: LogEntryPayload['context']) => appLog({ level: 'info', message, context }),
  debug: (message: string, context?: LogEntryPayload['context']) => appLog({ level: 'debug', message, context }),
}
