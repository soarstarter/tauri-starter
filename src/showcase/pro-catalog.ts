// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
//
// Capabilities that ship in SoarStarter Pro rather than this open-source
// starter. They are listed for discovery only: each card opens the Pro page in
// the system browser. Nothing here is implemented in this repository.
//
// This file and the `showcase:pro.*` locale keys are the only places allowed to
// describe Pro modules by name (see `pnpm check:lite`).
import {
  BadgeCheck,
  Bug,
  ChartNoAxesColumn,
  CreditCard,
  ListTodo,
  LockKeyhole,
  Network,
  RefreshCw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export const PRO_UPGRADE_URL = 'https://soarstarter.com/tauri?utm_source=github&utm_campaign=tauri-lite'

export interface ProCapability {
  id: string
  labelKey: string
  summaryKey: string
  icon: LucideIcon
}

const pro = (id: string, icon: LucideIcon): ProCapability => ({
  id,
  labelKey: `showcase:pro.items.${id}.title`,
  summaryKey: `showcase:pro.items.${id}.summary`,
  icon,
})

export const PRO_CATALOG: readonly ProCapability[] = [
  pro('email-auth', ShieldCheck),
  pro('unified-backend', Network),
  pro('synced-data', ListTodo),
  pro('checkout', CreditCard),
  pro('license-keys', BadgeCheck),
  pro('feature-gates', LockKeyhole),
  pro('auto-updates', RefreshCw),
  pro('error-reporting', Bug),
  pro('analytics', ChartNoAxesColumn),
]
