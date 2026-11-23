import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'
import { SectionShell, SettingRow } from './SectionShell'
import type { AppSettings, AppSettingsPatch } from '../use-settings-form'

interface Props {
  settings: AppSettings
  updateSettings: (patch: AppSettingsPatch) => Promise<AppSettings | null>
}

export const NotificationsSection = ({ settings, updateSettings }: Props) => {
  const { t } = useTranslation('settings')

  return (
    <SectionShell title={t('notifications.title')} description={t('notifications.description')}>
      <SettingRow
        label={t('notifications.enabled.label')}
        description={t('notifications.enabled.description')}
        control={
          <Switch
            checked={settings.notifications}
            onCheckedChange={(checked) => updateSettings({ notifications: checked })}
            aria-label={t('notifications.enabled.label')}
          />
        }
      />
    </SectionShell>
  )
}
