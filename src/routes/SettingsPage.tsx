import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SettingsSearch } from './settings/SettingsSearch'
import { useSettingsForm } from './settings/use-settings-form'
import { GeneralSection } from './settings/sections/GeneralSection'
import { AppearanceSection } from './settings/sections/AppearanceSection'
import { NotificationsSection } from './settings/sections/NotificationsSection'
import { ShortcutsSection } from './settings/sections/ShortcutsSection'
import { ProxySection } from './settings/sections/ProxySection'
import { StorageSection } from './settings/sections/StorageSection'
import { AdvancedSection } from './settings/sections/AdvancedSection'

const TAB_IDS = ['general', 'appearance', 'notifications', 'shortcuts', 'proxy', 'storage', 'advanced'] as const

type TabId = (typeof TAB_IDS)[number]

const DEFAULT_TAB: TabId = 'general'

const isTabId = (value: string | null): value is TabId =>
  typeof value === 'string' && (TAB_IDS as readonly string[]).includes(value)

export const SettingsPage = () => {
  const { t } = useTranslation('settings')
  const [searchParams, setSearchParams] = useSearchParams()
  const { settings, updateSettings, resetSettings } = useSettingsForm()

  const activeTab = useMemo<TabId>(() => {
    const candidate = searchParams.get('tab')
    return isTabId(candidate) ? candidate : DEFAULT_TAB
  }, [searchParams])

  const handleTabChange = (next: string) => {
    if (!isTabId(next)) return
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (next === DEFAULT_TAB) params.delete('tab')
        else params.set('tab', next)
        return params
      },
      { replace: true }
    )
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <SettingsSearch isTabVisible={isTabId} onSelect={handleTabChange} />
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start">
          {TAB_IDS.map((id) => (
            <TabsTrigger key={id} value={id}>
              {t(`tabs.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>

        {settings && (
          <div className="pt-4">
            <TabsContent value="general">
              <GeneralSection settings={settings} updateSettings={updateSettings} />
            </TabsContent>
            <TabsContent value="appearance">
              <AppearanceSection settings={settings} updateSettings={updateSettings} />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsSection settings={settings} updateSettings={updateSettings} />
            </TabsContent>
            <TabsContent value="shortcuts">
              <ShortcutsSection />
            </TabsContent>
            <TabsContent value="proxy">
              <ProxySection settings={settings} updateSettings={updateSettings} />
            </TabsContent>
            <TabsContent value="storage">
              <StorageSection settings={settings} updateSettings={updateSettings} />
            </TabsContent>
            <TabsContent value="advanced">
              <AdvancedSection resetSettings={resetSettings} />
            </TabsContent>
          </div>
        )}
      </Tabs>
    </section>
  )
}
