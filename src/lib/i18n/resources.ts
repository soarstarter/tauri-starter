import enCommon from '@/locales/en/common.json'
import enSettings from '@/locales/en/settings.json'
// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import enShowcase from '@/locales/en/showcase.json'
import zhCommon from '@/locales/zh/common.json'
import zhSettings from '@/locales/zh/settings.json'
// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import zhShowcase from '@/locales/zh/showcase.json'

export const SUPPORTED_LANGUAGES = ['en', 'zh'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
export const I18N_NAMESPACES = ['common', 'settings', 'showcase'] as const
export type I18nNamespace = (typeof I18N_NAMESPACES)[number]

export const DEFAULT_NAMESPACE: I18nNamespace = 'common'

export const resources = {
  en: {
    common: enCommon,
    settings: enSettings,
    // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
    showcase: enShowcase,
  },
  zh: {
    common: zhCommon,
    settings: zhSettings,
    // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
    showcase: zhShowcase,
  },
} as const

export const isSupportedLanguage = (value: unknown): value is SupportedLanguage =>
  typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)

export const resolveSupportedLanguage = (input: string | undefined | null): SupportedLanguage => {
  if (!input) return DEFAULT_LANGUAGE
  if (isSupportedLanguage(input)) return input
  const primary = input.toLowerCase().split(/[-_]/)[0]
  if (isSupportedLanguage(primary)) return primary
  return DEFAULT_LANGUAGE
}
