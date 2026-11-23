import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Bug, BookOpen, MessageSquare, ScrollText, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConveyor } from '@/hooks/use-conveyor'
import { buildBugReportUrl, buildFeedbackMailto, getHomepageUrl } from '@/lib/support'

interface HelpItem {
  icon: LucideIcon
  title: string
  description: string
  action: string
  onClick: () => void
}

const HelpRow = ({ item }: { item: HelpItem }) => {
  const Icon = item.icon
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 size-5 text-muted-foreground" />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{item.title}</p>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={item.onClick}>
        {item.action}
      </Button>
    </div>
  )
}

export const HelpPage = () => {
  const { t } = useTranslation('common')
  const { version } = useConveyor('app')
  const { webOpenUrl } = useConveyor('window')
  const navigate = useNavigate()
  const [appVersion, setAppVersion] = useState<string | undefined>(undefined)

  useEffect(() => {
    version()
      .then(setAppVersion)
      .catch(() => undefined)
  }, [version])

  const openUrl = (url: string) => {
    void webOpenUrl(url).catch(() => undefined)
  }

  const items: HelpItem[] = [
    {
      icon: BookOpen,
      title: t('help.documentation.title'),
      description: t('help.documentation.description'),
      action: t('help.documentation.action'),
      onClick: () => openUrl(getHomepageUrl()),
    },
    {
      icon: MessageSquare,
      title: t('help.feedback.title'),
      description: t('help.feedback.description'),
      action: t('help.feedback.action'),
      onClick: () => openUrl(buildFeedbackMailto(appVersion)),
    },
    {
      icon: Bug,
      title: t('help.bug.title'),
      description: t('help.bug.description'),
      action: t('help.bug.action'),
      onClick: () => openUrl(buildBugReportUrl({ version: appVersion })),
    },
    {
      icon: ScrollText,
      title: t('help.logs.title'),
      description: t('help.logs.description'),
      action: t('help.logs.action'),
      onClick: () => navigate('/logs'),
    },
  ]

  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">{t('help.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('help.description')}</p>
      </header>
      <div className="space-y-3">
        {items.map((item) => (
          <HelpRow key={item.title} item={item} />
        ))}
      </div>
    </section>
  )
}
