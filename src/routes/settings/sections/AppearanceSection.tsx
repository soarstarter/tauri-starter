import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { ACCENT_COLORS } from '@/lib/conveyor/schemas/app-schema'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  setAccentPreference,
  setThemePreference,
  type AccentPreference,
  type ThemePreference,
} from '@/utils/theme-settings'
import { SectionShell, SettingRow } from './SectionShell'
import type { AppSettings, AppSettingsPatch } from '../use-settings-form'

interface Props {
  settings: AppSettings
  updateSettings: (patch: AppSettingsPatch) => Promise<AppSettings | null>
}

const THEMES: ThemePreference[] = ['light', 'dark', 'system']

// Swatch colors mirror the --primary values in src/styles/globals.css.
const ACCENT_SWATCHES: Record<AccentPreference, string> = {
  default: '#3b76f6',
  blue: '#3b76f6',
  violet: 'hsl(262 83% 58%)',
  green: 'hsl(142 71% 45%)',
  rose: 'hsl(347 77% 50%)',
  amber: 'hsl(38 92% 50%)',
}

export const AppearanceSection = ({ settings, updateSettings }: Props) => {
  const { t } = useTranslation('settings')

  const updateTheme = async (next: ThemePreference) => {
    await setThemePreference(next)
    await updateSettings({ theme: next })
  }

  const updateAccent = async (next: AccentPreference) => {
    await setAccentPreference(next)
    await updateSettings({ accentColor: next })
  }

  return (
    <SectionShell title={t('appearance.title')} description={t('appearance.description')}>
      <SettingRow
        label={t('appearance.theme.label')}
        description={t('appearance.theme.description')}
        control={
          <div className="flex gap-2">
            {THEMES.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={settings.theme === option ? 'default' : 'outline'}
                onClick={() => updateTheme(option)}
              >
                {t(`appearance.theme.${option}`)}
              </Button>
            ))}
          </div>
        }
      />
      <SettingRow
        label={t('appearance.accent.label')}
        description={t('appearance.accent.description')}
        control={
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((option) => {
              const selected = settings.accentColor === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => void updateAccent(option)}
                  title={t(`appearance.accent.options.${option}`)}
                  aria-label={t(`appearance.accent.options.${option}`)}
                  aria-pressed={selected}
                  style={{ backgroundColor: ACCENT_SWATCHES[option] }}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition',
                    selected ? 'ring-2 ring-ring' : 'ring-1 ring-border hover:ring-ring/50'
                  )}
                >
                  {selected && <Check className="size-4 text-white" aria-hidden />}
                </button>
              )
            })}
          </div>
        }
      />
    </SectionShell>
  )
}
