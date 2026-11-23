import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { useConveyor } from '@/hooks/use-conveyor'
import { showcaseConfig } from '@/shared/config'
import { useCommandPaletteStore } from './command-palette-store'
import { buildCommandActions, topActions, type CommandAction, type CommandBuildContext } from './command-sources'

const GROUP_ORDER: CommandAction['group'][] = ['navigation', 'showcase', 'settings', 'recent']

export const CommandPalette = () => {
  const { t } = useTranslation(['common', 'settings', 'showcase'])
  const open = useCommandPaletteStore((s) => s.open)
  const setOpen = useCommandPaletteStore((s) => s.setOpen)
  const navigate = useNavigate()
  const { openFilePath } = useConveyor('file')
  const { getSettings } = useConveyor('app')
  const [query, setQuery] = useState('')
  const [recentFiles, setRecentFiles] = useState<string[]>([])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [setOpen])

  // Refresh recent files each time the palette opens.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    getSettings()
      .then((settings) => {
        if (!cancelled) setRecentFiles(settings.recentFiles)
      })
      .catch((error) => console.error('Failed to load recent files for palette:', error))
    return () => {
      cancelled = true
    }
  }, [open, getSettings])

  const openRecentFile = useCallback(
    (path: string) => {
      openFilePath(path)
        .then((result) => {
          if (!result.canceled) navigate('/showcase/file')
        })
        .catch((error) => console.error('Failed to open recent file from palette:', error))
    },
    [openFilePath, navigate]
  )

  const ctx: CommandBuildContext = useMemo(
    () => ({
      t: (key: string) => t(key),
      navigate: (to: string) => navigate(to),
      openRecentFile,
      isTabVisible: () => true,
      recentFiles,
      showcaseEnabled: showcaseConfig.enabled,
    }),
    [t, navigate, openRecentFile, recentFiles]
  )

  const actions = useMemo(() => buildCommandActions(ctx), [ctx])
  const suggestions = useMemo(() => topActions(actions, 5), [actions])

  // Empty query → curated top actions; otherwise show everything and let cmdk filter.
  const showSuggestionsOnly = query.trim() === ''

  const run = (action: CommandAction) => {
    action.perform()
    close()
  }

  const renderItem = (action: CommandAction) => {
    const Icon = action.icon
    return (
      <CommandItem
        key={action.id}
        // Disambiguate same-titled entries so cmdk keys/filters correctly.
        value={`${action.title} ${action.id}`}
        keywords={action.keywords}
        onSelect={() => run(action)}
      >
        {Icon && <Icon aria-hidden />}
        <span className="flex-1 truncate">{action.title}</span>
        {action.subtitle && <span className="ml-auto truncate text-xs text-muted-foreground">{action.subtitle}</span>}
      </CommandItem>
    )
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? setOpen(true) : close())}
      title={t('common:palette.title')}
      description={t('common:palette.description')}
    >
      <CommandInput value={query} onValueChange={setQuery} placeholder={t('common:palette.placeholder')} />
      <CommandList>
        <CommandEmpty>
          <div className="space-y-2">
            <p>{t('common:palette.empty.title')}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate('/help')
                close()
              }}
            >
              {t('common:palette.empty.help')}
            </Button>
          </div>
        </CommandEmpty>

        {showSuggestionsOnly ? (
          <CommandGroup heading={t('common:palette.groups.suggestions')}>{suggestions.map(renderItem)}</CommandGroup>
        ) : (
          GROUP_ORDER.map((group) => {
            const items = actions.filter((action) => action.group === group)
            if (items.length === 0) return null
            return (
              <CommandGroup key={group} heading={t(`common:palette.groups.${group}`)}>
                {items.map(renderItem)}
              </CommandGroup>
            )
          })
        )}
      </CommandList>
    </CommandDialog>
  )
}
