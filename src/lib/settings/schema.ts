import { z } from 'zod'

export const themeSettingSchema = z.enum(['light', 'dark', 'system'])
export const MIN_ZOOM_LEVEL = -3
export const MAX_ZOOM_LEVEL = 3
export const zoomLevelSchema = z.number().min(MIN_ZOOM_LEVEL).max(MAX_ZOOM_LEVEL)

export const ACCENT_COLORS = ['default', 'blue', 'violet', 'green', 'rose', 'amber'] as const
export const accentColorSchema = z.enum(ACCENT_COLORS)

export const localeSettingSchema = z.enum(['system', 'en', 'zh'])
export const supportedLanguageSchema = z.enum(['en', 'zh'])
export const proxyModeSchema = z.enum(['system', 'none', 'custom'])

export const proxySettingsSchema = z.object({
  mode: proxyModeSchema,
  url: z.string().url().optional(),
})

export const proxySettingsPatchSchema = z.object({
  mode: proxyModeSchema.optional(),
  url: z.string().url().nullable().optional(),
})

export const windowSettingsSchema = z.object({
  menusVisible: z.boolean(),
})

export const windowSettingsPatchSchema = z.object({
  menusVisible: z.boolean().optional(),
})

const shortcutIdSchema = z.string().min(1).max(64)
const acceleratorSchema = z.string().min(1).max(128)

export const shortcutOverridesSchema = z.record(shortcutIdSchema, acceleratorSchema)

export const MAX_RECENT_FILES = 10
export const recentFilesSchema = z.array(z.string().min(1)).max(MAX_RECENT_FILES)

export const appSettingsSchema = z.object({
  theme: themeSettingSchema,
  accentColor: accentColorSchema,
  zoomLevel: zoomLevelSchema,
  locale: localeSettingSchema,
  launchAtLogin: z.boolean(),
  minimizeToTray: z.boolean(),
  notifications: z.boolean(),
  proxy: proxySettingsSchema,
  window: windowSettingsSchema,
  shortcuts: shortcutOverridesSchema,
  recentFiles: recentFilesSchema,
  onboardingCompleted: z.boolean(),
  eulaAcceptedVersion: z.number().int().min(0),
  dataDir: z.string().min(1).optional(),
})

export const appSettingsPatchSchema = z.object({
  theme: themeSettingSchema.optional(),
  accentColor: accentColorSchema.optional(),
  zoomLevel: z.number().optional(),
  locale: localeSettingSchema.optional(),
  launchAtLogin: z.boolean().optional(),
  minimizeToTray: z.boolean().optional(),
  notifications: z.boolean().optional(),
  proxy: proxySettingsPatchSchema.optional(),
  window: windowSettingsPatchSchema.optional(),
  shortcuts: shortcutOverridesSchema.optional(),
  recentFiles: recentFilesSchema.optional(),
  onboardingCompleted: z.boolean().optional(),
  eulaAcceptedVersion: z.number().int().min(0).optional(),
  dataDir: z.string().min(1).nullable().optional(),
})

export const secureKeySchema = z.enum(['access-token', 'refresh-token', 'showcase-secret'])

export type AppSettings = z.infer<typeof appSettingsSchema>
export type AppSettingsPatch = z.infer<typeof appSettingsPatchSchema>
export type ProxySettingsPatch = z.infer<typeof proxySettingsPatchSchema>
export type WindowSettingsPatch = z.infer<typeof windowSettingsPatchSchema>
export type SecureKey = z.infer<typeof secureKeySchema>
