import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConveyor } from '@/hooks/use-conveyor'
import { useToast } from '@/hooks/use-toast'

export const LogsPage = () => {
  const { t } = useTranslation('common')
  const { getPath, openFolder, readTail } = useConveyor('logs')
  const toast = useToast()
  const [path, setPath] = useState<string | null>(null)
  const [tail, setTail] = useState('')
  const [pathError, setPathError] = useState(false)

  useEffect(() => {
    getPath()
      .then(setPath)
      .catch(() => setPathError(true))
    readTail(200)
      .then(setTail)
      .catch(() => setTail(''))
  }, [getPath, readTail])

  const handleOpenFolder = async () => {
    try {
      const result = await openFolder()
      if (result) {
        toast.error(t('logs.openFailed'))
      } else {
        toast.success(t('logs.opened'))
      }
    } catch {
      toast.error(t('logs.openFailed'))
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{t('logs.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('logs.description')}</p>
      </header>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3 text-sm">
        <div className="space-y-1">
          <span className="text-muted-foreground">{t('logs.path')}</span>
          <p className="font-mono text-xs break-all">{pathError ? t('logs.pathError') : (path ?? t('logs.loading'))}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleOpenFolder} disabled={!path}>
          <FolderOpen /> {t('logs.openFolder')}
        </Button>
      </div>

      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{t('logs.tail')}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void readTail(200).then(setTail)}
            aria-label={t('actions.refresh')}
          >
            <RefreshCw /> {t('actions.refresh')}
          </Button>
        </div>
        <pre className="max-h-80 overflow-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
          {tail || t('logs.empty')}
        </pre>
      </div>
    </section>
  )
}
