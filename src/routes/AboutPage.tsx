import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Copy, ExternalLink } from 'lucide-react'
import type { Diagnostics } from '@/lib/conveyor/schemas'
import { Button } from '@/components/ui/button'
import { useConveyor } from '@/hooks/use-conveyor'
import { useToast } from '@/hooks/use-toast'
import { getHomepageUrl, getLicenseUrl, getRepoUrl } from '@/lib/support'

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-mono text-xs break-all">{value}</span>
  </div>
)

export const AboutPage = () => {
  const { t } = useTranslation('common')
  const { getDiagnostics } = useConveyor('app')
  const { webOpenUrl } = useConveyor('window')
  const toast = useToast()
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    getDiagnostics()
      .then(setDiagnostics)
      .catch(() => setLoadError(true))
  }, [getDiagnostics])

  const openUrl = (url: string) => {
    void webOpenUrl(url).catch(() => undefined)
  }

  const copyDiagnostics = async () => {
    if (!diagnostics) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2))
      toast.success(t('about.copied'))
    } catch {
      toast.error(t('about.copyFailed'))
    }
  }

  const osString = diagnostics ? `${diagnostics.os.platform} ${diagnostics.os.release} (${diagnostics.os.arch})` : ''

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-semibold">{t('about.title')}</h1>

      {loadError ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {t('about.loadError')}
        </div>
      ) : !diagnostics ? (
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          {t('about.loading')}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('about.sections.application')}
            </h2>
            <Row label={t('about.fields.name')} value={diagnostics.app.name} />
            <Row label={t('about.fields.version')} value={diagnostics.app.version} />
            <Row label={t('about.fields.commit')} value={diagnostics.app.commit_sha} />
            <Row label={t('about.fields.buildTime')} value={diagnostics.app.build_time} />
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-2 text-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('about.sections.system')}
            </h2>
            <Row label="Tauri" value={diagnostics.versions.tauri} />
            <Row label="WebView" value={diagnostics.versions.webview} />
            <Row label="PID" value={String(diagnostics.versions.pid)} />
            <Row label={t('about.fields.os')} value={osString} />
            <Row label={t('about.fields.logPath')} value={diagnostics.log_path} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyDiagnostics}>
              <Copy /> {t('about.copyDiagnostics')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openUrl(getHomepageUrl())}>
              <ExternalLink /> {t('about.links.homepage')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openUrl(getRepoUrl())}>
              <ExternalLink /> {t('about.links.repository')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openUrl(getLicenseUrl())}>
              <ExternalLink /> {t('about.links.license')}
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
