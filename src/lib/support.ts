import { APP_NAME, HOMEPAGE_URL, LICENSE_URL, REPO_URL, SUPPORT_EMAIL } from '@/shared/constants'

/** Repository URL, env-overridable so buyers can retarget the bug tracker. */
export const getRepoUrl = (): string => import.meta.env.VITE_REPO_URL?.trim() || REPO_URL

export const getHomepageUrl = (): string => HOMEPAGE_URL
export const getLicenseUrl = (): string => LICENSE_URL
export const getSupportEmail = (): string => SUPPORT_EMAIL

/** `mailto:` link with a pre-filled subject for the Help "Send feedback" flow. */
export const buildFeedbackMailto = (version?: string): string => {
  const subject = version ? `${APP_NAME} feedback (v${version})` : `${APP_NAME} feedback`
  return `mailto:${getSupportEmail()}?subject=${encodeURIComponent(subject)}`
}

/**
 * Pre-filled GitHub "new issue" URL. `details` (e.g. a diagnostics blob or an
 * error message) is appended in a fenced block when provided.
 */
export const buildBugReportUrl = (opts: { version?: string; details?: string } = {}): string => {
  const title = `[Bug] ${APP_NAME}${opts.version ? ` v${opts.version}` : ''}: `
  const bodyLines = ['### What happened?', '', '', '### Steps to reproduce', '', '1. ', '']
  if (opts.details) {
    bodyLines.push('### Diagnostics', '', '```', opts.details, '```', '')
  }
  const params = new URLSearchParams({ title, body: bodyLines.join('\n') })
  return `${getRepoUrl()}/issues/new?${params.toString()}`
}
