import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/sonner'
import { useConveyor } from '@/hooks/use-conveyor'
import { SectionShell, SettingRow } from './SectionShell'
import type { AppSettings, AppSettingsPatch } from '../use-settings-form'

interface Props {
  settings: AppSettings
  updateSettings: (patch: AppSettingsPatch) => Promise<AppSettings | null>
}

export const StorageSection = ({ settings, updateSettings }: Props) => {
  const { t } = useTranslation(['settings', 'common'])
  const app = useConveyor('app')
  const [dataDirDraft, setDataDirDraft] = useState(settings.dataDir ?? '')
  const [importConfirmOpen, setImportConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setDataDirDraft(settings.dataDir ?? '')
  }, [settings.dataDir])

  const commitDataDir = () => {
    const trimmed = dataDirDraft.trim()
    if (trimmed === (settings.dataDir ?? '')) return
    updateSettings({ dataDir: trimmed.length === 0 ? null : trimmed })
  }

  const clearDataDir = () => {
    setDataDirDraft('')
    updateSettings({ dataDir: null })
  }

  const handleExport = async () => {
    setBusy(true)
    try {
      const result = await app.exportData()
      if (!result.canceled) toast.success(t('settings:storage.backup.exported'))
    } catch (error) {
      console.error('Failed to export backup:', error)
      toast.error(t('settings:storage.backup.exportError'))
    } finally {
      setBusy(false)
    }
  }

  const handleImport = async () => {
    setImportConfirmOpen(false)
    setBusy(true)
    try {
      const result = await app.importData()
      if (result.status === 'canceled') return
      if (result.status === 'error') {
        toast.error(result.message)
        return
      }
      // Re-sync the settings form with the restored values.
      await updateSettings(result.settings)
      toast.success(t('settings:storage.backup.imported'))
    } catch (error) {
      console.error('Failed to import backup:', error)
      toast.error(t('settings:storage.backup.importError'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionShell title={t('settings:storage.title')} description={t('settings:storage.description')}>
      <SettingRow
        label={t('settings:storage.dataDir.label')}
        description={t('settings:storage.dataDir.description')}
        align="start"
        control={
          <div className="flex w-64 flex-col gap-2">
            <Input
              type="text"
              placeholder={t('settings:storage.dataDir.placeholder')}
              value={dataDirDraft}
              onChange={(event) => setDataDirDraft(event.target.value)}
              onBlur={commitDataDir}
              aria-label={t('settings:storage.dataDir.label')}
            />
            <Button size="sm" variant="outline" type="button" onClick={clearDataDir} disabled={!settings.dataDir}>
              {t('settings:storage.dataDir.clear')}
            </Button>
          </div>
        }
      />

      <SettingRow
        label={t('settings:storage.backup.label')}
        description={t('settings:storage.backup.description')}
        align="start"
        control={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" type="button" onClick={() => void handleExport()} disabled={busy}>
              {t('settings:storage.backup.export')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setImportConfirmOpen(true)}
              disabled={busy}
            >
              {t('settings:storage.backup.import')}
            </Button>
          </div>
        }
      />

      <Dialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings:storage.backup.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('settings:storage.backup.confirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setImportConfirmOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant="default" size="sm" onClick={() => void handleImport()}>
              {t('settings:storage.backup.confirmAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionShell>
  )
}
