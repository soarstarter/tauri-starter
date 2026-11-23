import { initI18n, resolveSupportedLanguage, type SupportedLanguage } from './index'

interface BootstrapDeps {
  getSettings: () => Promise<{ locale: 'system' | 'en' | 'zh' }>
  getSystemLocale: () => Promise<string>
  setSettings: (patch: { locale: 'system' | 'en' | 'zh' }) => Promise<unknown>
}

export interface BootstrapResult {
  language: SupportedLanguage
  source: 'settings' | 'system' | 'fallback'
}

export const bootstrapI18n = async (deps: BootstrapDeps): Promise<BootstrapResult> => {
  let language: SupportedLanguage
  let source: BootstrapResult['source']

  try {
    const settings = await deps.getSettings()
    if (settings.locale !== 'system') {
      language = resolveSupportedLanguage(settings.locale)
      source = 'settings'
    } else {
      try {
        const systemLocale = await deps.getSystemLocale()
        const resolved = resolveSupportedLanguage(systemLocale)
        language = resolved
        source = resolved === 'en' && !systemLocale.toLowerCase().startsWith('en') ? 'fallback' : 'system'
      } catch (error) {
        console.error('Failed to read system locale:', error)
        language = 'en'
        source = 'fallback'
      }

      // Persist the resolved choice so future boots are deterministic.
      try {
        await deps.setSettings({ locale: language })
      } catch (error) {
        console.error('Failed to persist resolved locale:', error)
      }
    }
  } catch (error) {
    console.error('Failed to load settings for i18n bootstrap:', error)
    language = 'en'
    source = 'fallback'
  }

  initI18n(language)
  return { language, source }
}
