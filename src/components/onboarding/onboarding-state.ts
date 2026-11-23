import { EULA_URL, EULA_VERSION } from '@/shared/constants'

export interface EulaConfig {
  url: string
  version: number
  /** True only when an EULA URL is configured; otherwise onboarding has no gate. */
  required: boolean
}

export const eulaConfig: EulaConfig = {
  url: EULA_URL,
  version: EULA_VERSION,
  required: EULA_URL.trim() !== '',
}

export interface OnboardingDecisionInput {
  onboardingCompleted: boolean
  eulaAcceptedVersion: number
}

/**
 * Decide whether to show first-run onboarding. Shown when onboarding hasn't been
 * completed, or — when an EULA is configured — when a newer EULA version needs
 * re-acceptance. Pure so the branch matrix is unit-testable.
 */
export const shouldShowOnboarding = (input: OnboardingDecisionInput, eula: EulaConfig = eulaConfig): boolean => {
  if (!input.onboardingCompleted) return true
  if (eula.required && input.eulaAcceptedVersion < eula.version) return true
  return false
}
