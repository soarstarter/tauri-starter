import type { PropsWithChildren, ReactNode } from 'react'

interface SectionShellProps {
  title: string
  description?: string
  headingLevel?: 'h1' | 'h2'
  children: ReactNode
}

export const SectionShell = ({
  title,
  description,
  headingLevel = 'h2',
  children,
}: PropsWithChildren<SectionShellProps>) => {
  const Heading = headingLevel

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <Heading className={headingLevel === 'h1' ? 'text-xl font-semibold' : 'text-base font-semibold'}>
          {title}
        </Heading>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

interface SettingRowProps {
  label: string
  description?: string
  control: ReactNode
  align?: 'center' | 'start'
}

export const SettingRow = ({ label, description, control, align = 'center' }: SettingRowProps) => {
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:gap-6 ${
        align === 'center' ? 'sm:items-center' : 'sm:items-start'
      }`}
    >
      <div className="flex-1 space-y-1">
        <div className="text-sm font-medium">{label}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}
