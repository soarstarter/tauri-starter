import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { searchSettings } from './settings-search'

interface Props {
  /** Whether a given tab is currently shown (mirrors SettingsPage gating). */
  isTabVisible: (tabId: string) => boolean
  /** Jump to a tab when a result is chosen. */
  onSelect: (tabId: string) => void
}

export const SettingsSearch = ({ isTabVisible, onSelect }: Props) => {
  const { t } = useTranslation('settings')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => searchSettings(query, (key) => t(key), isTabVisible), [query, t, isTabVisible])

  const choose = (tabId: string) => {
    onSelect(tabId)
    setQuery('')
    setOpen(false)
  }

  const showResults = open && query.trim().length > 0

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        role="searchbox"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a result's mousedown registers before the list unmounts.
          window.setTimeout(() => setOpen(false), 120)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && results.length > 0) choose(results[0].entry.tabId)
          if (event.key === 'Escape') setOpen(false)
        }}
        placeholder={t('search.placeholder')}
        aria-label={t('search.placeholder')}
        className="pl-8"
      />

      {showResults && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">{t('search.empty')}</p>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((result) => (
                <li key={result.entry.id}>
                  <button
                    type="button"
                    // mousedown (not click) so it fires before the input blur closes the list.
                    onMouseDown={(event) => {
                      event.preventDefault()
                      choose(result.entry.tabId)
                    }}
                    className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="truncate">{result.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{result.tabLabel}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
