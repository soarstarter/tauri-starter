import { rendererLogger } from '@/lib/logging/logger'

export const logRendererError = (error: Error, context?: Record<string, string | number | boolean>): void => {
  void rendererLogger.error(error.message, {
    ...context,
    name: error.name,
    stack: error.stack ?? '',
  })
}
