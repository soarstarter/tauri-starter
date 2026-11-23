import { describe, expect, it } from 'vitest'
import { shouldShowOnboarding, type EulaConfig } from './onboarding-state'

const noEula: EulaConfig = { url: '', version: 1, required: false }
const withEula: EulaConfig = { url: 'https://example.com/eula', version: 2, required: true }

describe('shouldShowOnboarding', () => {
  it('shows on first run', () => {
    expect(shouldShowOnboarding({ onboardingCompleted: false, eulaAcceptedVersion: 0 }, noEula)).toBe(true)
  })

  it('does not show once completed and no EULA is configured', () => {
    expect(shouldShowOnboarding({ onboardingCompleted: true, eulaAcceptedVersion: 0 }, noEula)).toBe(false)
  })

  it('re-shows when a newer EULA needs acceptance', () => {
    expect(shouldShowOnboarding({ onboardingCompleted: true, eulaAcceptedVersion: 1 }, withEula)).toBe(true)
  })

  it('stays hidden when the accepted EULA version is current', () => {
    expect(shouldShowOnboarding({ onboardingCompleted: true, eulaAcceptedVersion: 2 }, withEula)).toBe(false)
  })

  it('shows on first run even when the EULA is already (somehow) marked accepted', () => {
    expect(shouldShowOnboarding({ onboardingCompleted: false, eulaAcceptedVersion: 2 }, withEula)).toBe(true)
  })
})
