import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConveyor } from '@/hooks/use-conveyor'
import type { ChannelReturn } from '@/lib/conveyor/schemas'
import { formatAcceleratorForDisplay } from '@/utils/accelerator'
import { SectionShell } from './SectionShell'

type ResolvedShortcut = ChannelReturn<'shortcuts-list'>[number]

export const ShortcutsSection = () => {
  const { t } = useTranslation('settings')
  const shortcut = useConveyor('shortcut')
  const [shortcuts, setShortcuts] = useState<ResolvedShortcut[]>([])

  useEffect(() => {
    shortcut
      .list()
      .then(setShortcuts)
      .catch((error) => console.error('Failed to load shortcuts:', error))
  }, [shortcut])

  return (
    <SectionShell title={t('shortcuts.title')} description={t('shortcuts.description')}>
      {shortcuts.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('shortcuts.empty')}</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {shortcuts.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-4 p-3">
              <div className="flex-1 space-y-0.5">
                <div className="text-sm font-medium">{entry.description}</div>
                <div className="text-xs text-muted-foreground">{entry.id}</div>
              </div>
              <kbd className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs">
                {formatAcceleratorForDisplay(entry.accelerator)}
              </kbd>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  )
}
