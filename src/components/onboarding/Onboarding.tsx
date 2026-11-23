import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Rocket, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EulaConfig } from './onboarding-state'

interface Props {
  eula: EulaConfig
  /** Called with the accepted EULA version (0 when no EULA is configured). */
  onComplete: (eulaVersion: number) => void
  openExternal: (url: string) => void
}

const HIGHLIGHTS = [
  { key: 'workspace', icon: Sparkles },
  { key: 'local', icon: Rocket },
  { key: 'privacy', icon: ShieldCheck },
] as const

/**
 * First-run onboarding overlay. Intentionally a self-contained modal (not the
 * dismissable shadcn Dialog) so it can't be escaped without finishing — which,
 * when an EULA is configured, requires explicit acceptance.
 */
export const Onboarding = ({ eula, onComplete, openExternal }: Props) => {
  const { t } = useTranslation('common')
  const [step, setStep] = useState(0)
  const [accepted, setAccepted] = useState(false)

  // Steps: welcome, highlights, and — only when configured — an EULA gate.
  const lastStep = eula.required ? 2 : 1
  const isLast = step === lastStep
  const canFinish = !eula.required || accepted

  const finish = () => {
    if (!canFinish) return
    onComplete(eula.required ? eula.version : 0)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      data-testid="onboarding"
    >
      <div className="w-full max-w-md space-y-5 rounded-xl border border-border bg-card p-6 shadow-xl">
        {step === 0 && (
          <div className="space-y-2 text-center">
            <Sparkles className="mx-auto size-8 text-primary" aria-hidden />
            <h2 id="onboarding-title" className="text-lg font-semibold">
              {t('onboarding.welcome.title', { app: t('appName') })}
            </h2>
            <p className="text-sm text-muted-foreground">{t('onboarding.welcome.description')}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 id="onboarding-title" className="text-lg font-semibold">
              {t('onboarding.highlights.title')}
            </h2>
            <ul className="space-y-2.5">
              {HIGHLIGHTS.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t(`onboarding.highlights.items.${key}.title`)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t(`onboarding.highlights.items.${key}.description`)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {eula.required && step === 2 && (
          <div className="space-y-3">
            <h2 id="onboarding-title" className="text-lg font-semibold">
              {t('onboarding.eula.title')}
            </h2>
            <p className="text-sm text-muted-foreground">{t('onboarding.eula.description')}</p>
            <button
              type="button"
              onClick={() => openExternal(eula.url)}
              className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              {t('onboarding.eula.read')}
            </button>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-0.5 size-4"
              />
              <span>{t('onboarding.eula.accept')}</span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {t('onboarding.step', { current: step + 1, total: lastStep + 1 })}
          </span>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((value) => value - 1)}>
                {t('onboarding.back')}
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish} disabled={!canFinish}>
                {t('onboarding.finish')}
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((value) => value + 1)}>
                {t('onboarding.next')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
