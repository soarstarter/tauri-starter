import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  I18N_NAMESPACES,
  SUPPORTED_LANGUAGES,
  resources,
  type SupportedLanguage,
} from './resources'

export type { SupportedLanguage } from './resources'
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, resolveSupportedLanguage } from './resources'

let initialized = false

export const initI18n = (language: SupportedLanguage): typeof i18n => {
  if (initialized) {
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
    return i18n
  }

  void i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    ns: I18N_NAMESPACES as unknown as string[],
    defaultNS: DEFAULT_NAMESPACE,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    returnNull: false,
  })

  initialized = true
  return i18n
}

export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  if (!initialized) initI18n(language)
  else await i18n.changeLanguage(language)
}

export default i18n
