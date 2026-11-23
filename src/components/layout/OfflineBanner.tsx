import { useTranslation } from 'react-i18next'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/use-online-status'

/**
 * Renders into the AppShell banner slot only while the OS reports no network.
 * Returns null when online so the slot collapses and adds no layout cost.
 */
export const OfflineBanner = () => {
  const { t } = useTranslation('common')
  const online = useOnlineStatus()

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-banner"
      className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-4 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300"
    >
      <WifiOff className="size-3.5 shrink-0" aria-hidden />
      {t('banner.offline')}
    </div>
  )
}
