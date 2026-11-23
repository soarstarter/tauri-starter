import { useEffect, useState } from 'react'
import { useConveyor } from '@/hooks/use-conveyor'
import { Onboarding } from './Onboarding'
import { eulaConfig, shouldShowOnboarding } from './onboarding-state'

/**
 * Decides whether to show first-run onboarding and persists completion. Renders
 * nothing once onboarding is done (or while the decision is still loading).
 */
export const OnboardingGate = () => {
  const { getSettings, setSettings } = useConveyor('app')
  const { webOpenUrl } = useConveyor('window')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let cancelled = false
    getSettings()
      .then((settings) => {
        if (!cancelled) setVisible(shouldShowOnboarding(settings))
      })
      .catch((error) => {
        console.error('Failed to evaluate onboarding state:', error)
      })
    return () => {
      cancelled = true
    }
  }, [getSettings])

  const complete = (eulaVersion: number) => {
    setVisible(false)
    setSettings({ onboardingCompleted: true, eulaAcceptedVersion: eulaVersion }).catch((error) => {
      console.error('Failed to persist onboarding completion:', error)
    })
  }

  if (!visible) return null

  return <Onboarding eula={eulaConfig} onComplete={complete} openExternal={(url) => void webOpenUrl(url)} />
}
