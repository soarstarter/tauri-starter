import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useConveyor } from '@/hooks/use-conveyor'
import { buildBugReportUrl } from '@/lib/support'

interface ErrorRouteState {
  message?: string
  stack?: string
}

export const ErrorPage = () => {
  const { t } = useTranslation('common')
  const location = useLocation()
  const navigate = useNavigate()
  const { openFolder } = useConveyor('logs')
  const { webOpenUrl } = useConveyor('window')
  const state = (location.state as ErrorRouteState | null) ?? null

  const openLogs = () => void openFolder().catch(() => undefined)
  const reportBug = () => void webOpenUrl(buildBugReportUrl({ details: state?.message })).catch(() => undefined)

  return (
    <div data-testid="error-page" className="w-full max-w-lg space-y-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">{t('error.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('error.description')}</p>
      </div>
      {state?.message && (
        <pre className="max-h-32 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-left text-xs">
          {state.message}
        </pre>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => navigate(0)}>{t('error.actions.reload')}</Button>
        <Button variant="outline" onClick={() => navigate('/home')}>
          {t('error.actions.goHome')}
        </Button>
        <Button variant="outline" onClick={openLogs}>
          {t('error.actions.openLogs')}
        </Button>
        <Button variant="outline" onClick={reportBug}>
          {t('error.actions.reportBug')}
        </Button>
      </div>
    </div>
  )
}
