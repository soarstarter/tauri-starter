import { commands } from '@/lib/bindings'

export const diagnosticsApi = {
  get: () => commands.diagnostics(),
}

export type DiagnosticsApi = typeof diagnosticsApi
