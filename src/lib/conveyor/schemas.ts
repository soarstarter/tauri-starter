import type { AppSettings, AppSettingsPatch, SecureKey } from '@/lib/settings/schema'
import type { SHORTCUTS } from '@/lib/shortcuts'
import type { Diagnostics } from '@/lib/bindings'

export type { AppSettings, AppSettingsPatch, Diagnostics, SecureKey }
export { ACCENT_COLORS } from '@/lib/settings/schema'

export interface ResolvedShortcut {
  id: (typeof SHORTCUTS)[number]['id'] | string
  accelerator: string
  description: string
}

type ChannelMap = {
  'get-settings': { args: []; return: AppSettings }
  'set-settings': { args: [AppSettingsPatch]; return: AppSettings }
  'reset-settings': { args: []; return: AppSettings }
  'shortcuts-list': { args: []; return: ResolvedShortcut[] }
}

export type ChannelArgs<T extends keyof ChannelMap> = ChannelMap[T]['args']
export type ChannelReturn<T extends keyof ChannelMap> = ChannelMap[T]['return']
