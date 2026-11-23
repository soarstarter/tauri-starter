import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  FolderOpen,
  Gauge,
  PackageCheck,
  HelpCircle,
  Settings,
  ShieldCheck,
  TerminalSquare,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { CAPABILITY_CATALOG, capabilitiesIn } from '@/showcase/capability-catalog'
import type { CapabilityCategory, TemplateCapability } from '@/showcase/capability-types'
import { showcaseConfig } from '@/shared/config'

interface ChecklistItem {
  id: 'branding' | 'settings' | 'distribution'
  icon: LucideIcon
}

interface NeutralQuickAction {
  id: 'logs' | 'settings' | 'help'
  to: string
  icon: LucideIcon
}

const CHECKLIST_ITEMS: readonly ChecklistItem[] = [
  { id: 'branding', icon: ShieldCheck },
  { id: 'settings', icon: Bell },
  { id: 'distribution', icon: PackageCheck },
] as const

const NEUTRAL_QUICK_ACTIONS: readonly NeutralQuickAction[] = [
  { id: 'logs', to: '/logs', icon: TerminalSquare },
  { id: 'settings', to: '/settings', icon: Settings },
  { id: 'help', to: '/help', icon: HelpCircle },
] as const

// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
const CATEGORY_ORDER: readonly CapabilityCategory[] = ['shell', 'system', 'data', 'ops']

const CATEGORY_ACCENTS: Record<CapabilityCategory, string> = {
  shell: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
  system: 'bg-violet-500/10 text-violet-700 dark:text-violet-300',
  data: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  ops: 'bg-rose-500/10 text-rose-700 dark:text-rose-300',
}

const SHOWCASE_CATEGORY_HIGHLIGHTS = CATEGORY_ORDER.flatMap((category) => {
  const capability = capabilitiesIn(category).find((entry) => entry.route)
  return capability ? [{ category, capability }] : []
})

const SHOWCASE_QUICK_ACTIONS = CAPABILITY_CATALOG.filter(
  (capability): capability is TemplateCapability & { route: string } =>
    Boolean(capability.route) && capability.status === 'live'
).slice(0, 4)

export const HomePage = () => {
  const { t } = useTranslation(['common', 'showcase'])
  const showcaseEnabled = showcaseConfig.enabled
  const quickActions = showcaseEnabled
    ? SHOWCASE_QUICK_ACTIONS.map((capability) => ({
        id: capability.id,
        to: capability.route,
        title: t(capability.labelKey),
        description: t(capability.summaryKey),
        icon: capability.icon,
      }))
    : NEUTRAL_QUICK_ACTIONS.map((action) => ({
        ...action,
        title: t(`common:home.quickActions.items.${action.id}.title`),
        description: t(`common:home.quickActions.items.${action.id}.description`),
      }))

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          <Badge variant="outline">{t('home.badge')}</Badge>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{t('home.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('home.description')}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to={showcaseEnabled ? '/showcase' : '/settings'}>
              <FolderOpen className="size-4" aria-hidden />
              {showcaseEnabled ? t('common:home.actions.exploreShowcase') : t('common:home.actions.openWorkspace')}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/settings">
              <Settings className="size-4" aria-hidden />
              {t('common:home.actions.configure')}
            </Link>
          </Button>
        </div>
      </header>

      {/* [template-demo] Safe to delete — see docs/CUSTOMIZE.md. */}
      {showcaseEnabled && (
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">{t('common:home.showcase.title')}</h2>
            <p className="text-xs text-muted-foreground">{t('common:home.showcase.description')}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {SHOWCASE_CATEGORY_HIGHLIGHTS.map(({ category, capability }) => {
              const Icon = capability.icon
              return (
                <Link
                  key={category}
                  to={capability.route ?? '/showcase'}
                  className="group rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Badge variant="outline">{t(`showcase:categories.${category}`)}</Badge>
                    <div className={cn('rounded-md p-2', CATEGORY_ACCENTS[category])}>
                      <Icon className="size-5" aria-hidden />
                    </div>
                  </div>
                  <h3 className="mt-4 text-sm font-medium">{t(capability.labelKey)}</h3>
                  <p className="mt-1 line-clamp-3 text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                    {t(capability.summaryKey)}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{t('home.checklist.title')}</h2>
              <p className="text-xs text-muted-foreground">{t('home.checklist.description')}</p>
            </div>
            <Badge variant="secondary">{t('home.checklist.badge')}</Badge>
          </div>

          <div className="grid gap-3 grid-cols-1">
            {CHECKLIST_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-2 text-muted-foreground">
                      <Icon className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-medium">{t(`home.checklist.items.${item.id}.title`)}</h3>
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t(`home.checklist.items.${item.id}.description`)}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">
              {showcaseEnabled ? t('common:home.quickActions.showcaseTitle') : t('common:home.quickActions.title')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {showcaseEnabled
                ? t('common:home.quickActions.showcaseDescription')
                : t('common:home.quickActions.description')}
            </p>
          </div>

          <div className="grid gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.id}
                  to={action.to}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="rounded-md bg-muted p-2 text-muted-foreground group-hover:text-accent-foreground">
                    <Icon className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium">{action.title}</h3>
                    <p className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground group-hover:text-accent-foreground"
                    aria-hidden
                  />
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      {/* [template-demo] Safe to delete — see docs/CUSTOMIZE.md. */}
      {showcaseEnabled && (
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-muted-foreground" aria-hidden />
                <h2 className="text-base font-semibold">{t('home.stack.title')}</h2>
              </div>
              <p className="text-xs text-muted-foreground">{t('home.stack.description')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Tauri', 'react', 'typescript', 'tailwind'].map((item) => (
                <Badge key={item} variant="outline">
                  {t(`home.stack.items.${item}`)}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}
    </section>
  )
}
