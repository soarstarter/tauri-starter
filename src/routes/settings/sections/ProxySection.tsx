import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SectionShell, SettingRow } from './SectionShell'
import type { AppSettings, AppSettingsPatch } from '../use-settings-form'

type ProxyMode = AppSettings['proxy']['mode']
const PROXY_MODES: ProxyMode[] = ['system', 'none', 'custom']

interface Props {
  settings: AppSettings
  updateSettings: (patch: AppSettingsPatch) => Promise<AppSettings | null>
}

export const ProxySection = ({ settings, updateSettings }: Props) => {
  const { t } = useTranslation('settings')
  const [urlDraft, setUrlDraft] = useState(settings.proxy.url ?? '')

  useEffect(() => {
    setUrlDraft(settings.proxy.url ?? '')
  }, [settings.proxy.url])

  const commitUrl = () => {
    const trimmed = urlDraft.trim()
    if (trimmed === (settings.proxy.url ?? '')) return
    updateSettings({ proxy: { url: trimmed.length === 0 ? null : trimmed } })
  }

  return (
    <SectionShell title={t('proxy.title')} description={t('proxy.description')}>
      <SettingRow
        label={t('proxy.mode.label')}
        description={t('proxy.mode.description')}
        control={
          <Select
            value={settings.proxy.mode}
            onValueChange={(value) => updateSettings({ proxy: { mode: value as ProxyMode } })}
          >
            <SelectTrigger className="w-48" aria-label={t('proxy.mode.label')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROXY_MODES.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {t(`proxy.mode.${mode}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <SettingRow
        label={t('proxy.url.label')}
        description={t('proxy.url.description')}
        align="start"
        control={
          <Input
            className="w-64"
            type="url"
            placeholder={t('proxy.url.placeholder')}
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            onBlur={commitUrl}
            disabled={settings.proxy.mode !== 'custom'}
            aria-label={t('proxy.url.label')}
          />
        }
      />
    </SectionShell>
  )
}
