import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useConveyor } from '@/hooks/use-conveyor'
import { changeLanguage, resolveSupportedLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n'
import { SectionShell, SettingRow } from './SectionShell'
import type { AppSettings, AppSettingsPatch } from '../use-settings-form'

const LANGUAGE_CHOICES: Array<'system' | SupportedLanguage> = ['system', ...SUPPORTED_LANGUAGES]

interface Props {
  settings: AppSettings
  updateSettings: (patch: AppSettingsPatch) => Promise<AppSettings | null>
}

export const GeneralSection = ({ settings, updateSettings }: Props) => {
  const { t, i18n } = useTranslation('settings')
  const app = useConveyor('app')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const updateLocale = async (next: 'system' | SupportedLanguage) => {
    if (!(await updateSettings({ locale: next }))) return
    const effective = next === 'system' ? resolveSupportedLanguage(await app.getLocale()) : next
    await changeLanguage(effective)
    await app.setLocale(effective)
    setStatusMessage(t('messages.languageChanged'))
  }

  return (
    <SectionShell title={t('general.title')} description={t('general.description')}>
      <SettingRow
        label={t('general.language.label')}
        description={t('general.language.description')}
        control={
          <Select
            value={settings.locale}
            onValueChange={(value) => updateLocale(value as 'system' | SupportedLanguage)}
          >
            <SelectTrigger className="w-48" aria-label={t('general.language.label')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_CHOICES.map((choice) => (
                <SelectItem key={choice} value={choice}>
                  {t(`general.language.${choice}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      {statusMessage && (
        <p className="text-xs text-muted-foreground" key={i18n.language}>
          {statusMessage}
        </p>
      )}
      <SettingRow
        label={t('general.launchAtLogin.label')}
        description={t('general.launchAtLogin.description')}
        control={
          <Switch
            checked={settings.launchAtLogin}
            onCheckedChange={(checked) => updateSettings({ launchAtLogin: checked })}
            aria-label={t('general.launchAtLogin.label')}
          />
        }
      />
      <SettingRow
        label={t('general.minimizeToTray.label')}
        description={t('general.minimizeToTray.description')}
        control={
          <Switch
            checked={settings.minimizeToTray}
            onCheckedChange={(checked) => updateSettings({ minimizeToTray: checked })}
            aria-label={t('general.minimizeToTray.label')}
          />
        }
      />
    </SectionShell>
  )
}
