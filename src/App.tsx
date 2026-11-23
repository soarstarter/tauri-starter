import { lazy, useEffect, useRef } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ShellLessLayout } from '@/components/layout/ShellLessLayout'
import { RouterErrorBoundary } from '@/components/RouterErrorBoundary'
import { OnboardingGate } from '@/components/onboarding/OnboardingGate'
import { ErrorPage } from '@/routes/ErrorPage'
import { changeLanguage, initI18n, resolveSupportedLanguage } from '@/lib/i18n'
import { getSettings } from '@/lib/settings/store'
import { appIntents } from '@/lib/intents'
import { showcaseConfig } from '@/shared/config'
import { loadAccentPreference, loadThemePreference } from '@/utils/theme-settings'

const HomePage = lazy(() => import('@/routes/HomePage').then((m) => ({ default: m.HomePage })))
const SettingsPage = lazy(() => import('@/routes/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const AboutPage = lazy(() => import('@/routes/AboutPage').then((m) => ({ default: m.AboutPage })))
const NotFoundPage = lazy(() => import('@/routes/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const LogsPage = lazy(() => import('@/routes/LogsPage').then((m) => ({ default: m.LogsPage })))
const HelpPage = lazy(() => import('@/routes/HelpPage').then((m) => ({ default: m.HelpPage })))
const ShowcasePage = lazy(() => import('@/routes/showcase/ShowcasePage').then((m) => ({ default: m.ShowcasePage })))
const ShowcaseDemoRoute = lazy(() => import('@/routes/showcase/DemoRoute').then((m) => ({ default: m.DemoRoute })))
const ComponentsPage = lazy(() =>
  import('@/routes/showcase/components/ComponentsPage').then((m) => ({ default: m.ComponentsPage }))
)

const AppIntentNavigation = () => {
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    return appIntents.subscribe((intent) => {
      if (intent.type === 'navigate') navigateRef.current(intent.route)
    })
  }, [])

  return null
}

initI18n('en')

export default function App() {
  useEffect(() => {
    loadThemePreference().catch((error) => console.error('Failed to load theme preference:', error))
    loadAccentPreference().catch((error) => console.error('Failed to load accent preference:', error))
    getSettings()
      .then((settings) => {
        const language = settings.locale === 'system' ? resolveSupportedLanguage(navigator.language) : settings.locale
        return changeLanguage(language)
      })
      .catch((error) => console.error('Failed to initialize app preferences:', error))
  }, [])

  return (
    <>
      <HashRouter>
        <AppIntentNavigation />
        <RouterErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route element={<ShellLessLayout />}>
              <Route path="/error" element={<ErrorPage />} />
            </Route>
            <Route element={<AppShell />}>
              <Route path="/home" element={<HomePage />} />
              {showcaseConfig.enabled && (
                <>
                  <Route path="/showcase" element={<ShowcasePage />} />
                  <Route path="/showcase/components" element={<ComponentsPage />} />
                  <Route path="/showcase/:demoId" element={<ShowcaseDemoRoute />} />
                </>
              )}
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </RouterErrorBoundary>
      </HashRouter>
      <OnboardingGate />
    </>
  )
}
