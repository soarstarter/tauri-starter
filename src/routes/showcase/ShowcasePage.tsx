import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { openExternalUrl } from '@/lib/tauri/external-url'
import { CAPABILITY_CATALOG } from '@/showcase/capability-catalog'
import { PRO_CATALOG, PRO_UPGRADE_URL } from '@/showcase/pro-catalog'

export const ShowcasePage = () => {
  const { t } = useTranslation('showcase')

  const openProPage = () => {
    void openExternalUrl(PRO_UPGRADE_URL).catch(() => undefined)
  }

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {CAPABILITY_CATALOG.filter((entry) => entry.route).map((entry) => {
          const Icon = entry.icon
          return (
            <Link
              key={entry.id}
              to={entry.route ?? '/showcase'}
              className="rounded-lg border border-border bg-card p-4"
            >
              <Icon className="mb-3 size-5 text-muted-foreground" aria-hidden />
              <h2 className="text-sm font-medium">{t(entry.labelKey)}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{t(entry.summaryKey)}</p>
            </Link>
          )
        })}
      </div>
      <section className="space-y-3 pt-4" aria-labelledby="showcase-pro-heading">
        <div className="space-y-1">
          <h2 id="showcase-pro-heading" className="text-base font-semibold">
            {t('pro.title')}
          </h2>
          <p className="max-w-3xl text-xs text-muted-foreground">{t('pro.description')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {PRO_CATALOG.map((capability) => {
            const Icon = capability.icon
            return (
              <button
                key={capability.id}
                type="button"
                onClick={openProPage}
                data-testid={`pro-capability-${capability.id}`}
                className="group rounded-lg border border-dashed border-border bg-card/60 p-4 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon className="mb-3 size-5 text-muted-foreground" aria-hidden />
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground group-hover:text-accent-foreground"
                    aria-label={t('pro.action')}
                  />
                </div>
                <h3 className="text-sm font-medium">{t(capability.labelKey)}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t(capability.summaryKey)}</p>
                <Badge variant="outline" className="mt-3">
                  {t('pro.badge')}
                </Badge>
              </button>
            )
          })}
        </div>
      </section>
    </section>
  )
}
