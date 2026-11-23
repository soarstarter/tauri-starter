import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { SIDEBAR_GROUPS, type SidebarItem } from './sidebar-items'

interface SidebarProps {
  collapsed: boolean
}

const isActiveItem = (item: SidebarItem, pathname: string): boolean => {
  const target = item.to.split('?')[0]
  if (target === '/home') return pathname === '/' || pathname === '/home'
  return pathname === target || pathname.startsWith(target + '/')
}

export const Sidebar = ({ collapsed }: SidebarProps) => {
  const { t } = useTranslation('common')
  const location = useLocation()

  return (
    <aside
      data-testid="app-sidebar"
      data-collapsed={collapsed || undefined}
      className={cn(
        'flex flex-col border-r border-border bg-card/40',
        'shrink-0 transition-[width] duration-150 ease-out',
        collapsed ? 'w-14' : 'w-56'
      )}
    >
      <nav className="flex-1 overflow-y-auto py-3">
        {SIDEBAR_GROUPS.map((group, idx) => (
          <div key={group.id} className={cn(idx > 0 && 'mt-4')}>
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t(group.labelKey)}
              </div>
            )}
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActiveItem(item, location.pathname)
                return (
                  <li key={item.id}>
                    <NavLink
                      to={item.to}
                      title={collapsed ? t(item.labelKey) : undefined}
                      data-active={active || undefined}
                      className={cn(
                        'flex items-center rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        'data-[active]:bg-accent data-[active]:text-accent-foreground',
                        collapsed ? 'justify-center' : 'gap-2'
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {!collapsed && <span className="truncate">{t(item.labelKey)}</span>}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
