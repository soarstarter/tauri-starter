import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SectionShell, SettingRow } from './SectionShell'
import type { AppSettings } from '../use-settings-form'

interface Props {
  resetSettings: () => Promise<AppSettings | null>
}

export const AdvancedSection = ({ resetSettings }: Props) => {
  const { t } = useTranslation(['settings', 'common'])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resetMessage, setResetMessage] = useState<string | null>(null)

  const handleReset = async () => {
    const next = await resetSettings()
    setConfirmOpen(false)
    if (next) setResetMessage(t('settings:messages.settingsReset'))
  }

  return (
    <SectionShell title={t('settings:advanced.title')} description={t('settings:advanced.description')}>
      <SettingRow
        label={t('settings:advanced.reset.label')}
        description={t('settings:advanced.reset.description')}
        control={
          <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
            {t('settings:advanced.reset.button')}
          </Button>
        }
      />
      {resetMessage && <p className="text-xs text-muted-foreground">{resetMessage}</p>}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings:advanced.reset.confirmTitle')}</DialogTitle>
            <DialogDescription>{t('settings:advanced.reset.confirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleReset}>
              {t('settings:advanced.reset.confirmAction')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionShell>
  )
}
